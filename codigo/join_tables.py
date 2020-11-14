import pandas as pd
from osgeo import ogr, osr
import psycopg2

from airflow.models import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago


#Funcion para leer un excel
def readExcel(**kwargs):

    dicc = kwargs

    #Se lee con pandas y se pasa a diccionario
    xl = pd.read_excel(dicc["ruta"], sheet_name=dicc["sheet_name"], header=dicc["header"], usecols=dicc["usecols"]).to_dict()

    #Se guarda como variable XCOM
    #kwargs['ti'].xcom_push(key='LeeExcel', value=xl)

    json ={
        'properties':[]
    }

    for i in xl:
        lon = len(xl[i])
        break

    for i in range (0, lon):
        dic={}
        for j in xl:
            dic.update({j : xl[j][i]})
        json['properties'].append(dic)

    #Se guarda como variable XCOM
    kwargs['ti'].xcom_push(key='LeeExcel', value=json)
            

#Función para leer un shapefile y pasarlo a geojson
def readSHP(**kwargs):
    
    #ruta del shp
    daShapefile = kwargs["ruta"]
    #nombre del shp extraido a partir de la ruta
    layer_name = daShapefile.split("/")[-1].split(".")[0]
    #listas con los atributos que te quieres quedar del shp
    lista = kwargs["attributes"]

    #Lectura del sho con osg
    driver = ogr.GetDriverByName('ESRI Shapefile')

    dataSource = driver.Open(daShapefile, 0)

    #Se comrpueba si se han seleccionado atributos que filtrar
    if len(lista) > 0:

        sql = "SELECT %s FROM %s" %(','.join(lista), layer_name)

    else:

        sql = "SELECT * FROM %s" %(layer_name)


    #Capa filtrada
    layer = dataSource.ExecuteSQL(sql)

    #se define el geojson
    fc = {
        'type': 'FeatureCollection',
        'features': []
        }

    #se exportan a json los registros y se guardan
    for feature in layer:    
        fc['features'].append(feature.ExportToJson(as_object=True))

    #se obtiene el sistema de referencia
    epsg = layer.GetSpatialRef().GetAuthorityCode(None)

    #se guardan las variables como XCOM - geojson, epsg y nommbre de capa
    kwargs['ti'].xcom_push(key='LeeSHP', value=fc)
    kwargs['ti'].xcom_push(key='LeeSHP_EPSG', value=epsg)


def joinTables(**kwargs):

    attr1=kwargs["0"]
    attr2=kwargs["1"]

    table1 = kwargs['ti'].xcom_pull(key='LeeSHP')
    table2 = kwargs['ti'].xcom_pull(key='LeeExcel')

    rows = len(table1['features'])

    join = {
        'type': 'FeatureCollection',
        'features': []
        }

    k=0
    for i in table2['properties']:
        for j in range (0, rows):
            a=table1['features'][j]['properties'][attr1]
            if str(i[attr2])==str(a):
                join['features'].append(table1['features'][j])
                join['features'][k]['properties'].update(i)
                k+=1
            
    kwargs['ti'].xcom_push(key='uneTablas', value=join)

def renameAttr(lista,**kwargs):
    table = kwargs['ti'].xcom_pull(key='uneTablas')

    fc = {
        'type': 'FeatureCollection',
        'features': []
        }

    for i in table['features']:

        dic = {}

        for j in i:

            if j=='properties':
                dic[j]={}

                for key in i[j]:
                
                    for k in range (0, len(lista), 2):
                
                        if str(key) == str(lista[k]):

                            dic['properties'][lista[k+1]] = i['properties'][key]
                            if key in dic['properties']:
                                del dic['properties'][key]
                            break
                        else:
                    
                            dic['properties'][key] = i['properties'][key]
            else:
                dic[j] = i[j]

        fc['features'].append(dic)

    kwargs['ti'].xcom_push(key='renombraAtributo', value=fc)


def removeAttr(lista,**kwargs):

    table = kwargs['ti'].xcom_pull(key='renombraAtributo')

    fc = {
        'type': 'FeatureCollection',
        'features': []
        }

    for i in table['features']:

        dic = {}

        for j in i:

            if j=='properties':
                dic[j]={}

                for key in i[j]:
                
                    for k in range (0, len(lista)):
                
                        if str(key) == str(lista[k]):

                            if key in dic['properties']:
                                del dic['properties'][key]
                            break
                        else:
                    
                            dic['properties'][key] = i['properties'][key]

            else:
                dic[j] = i[j]
        fc['features'].append(dic)
    
    kwargs['ti'].xcom_push(key='eliminaAtributo', value=fc)

def filter(lista,**kwargs):

    table = kwargs['ti'].xcom_pull(key='eliminaAtributo')

    fc = {
        'type': 'FeatureCollection',
        'features': []
        }
    
    fcFiltered = {
        'type': 'FeatureCollection',
        'features': []
        }

    for i in table['features']:
        if i['properties'][lista[0]] == lista[1]:
            fcFiltered['features'].append(i)
        else:
            fc['features'].append(i)
    
    kwargs['ti'].xcom_push(key='filtroTrue', value=fcFiltered)
    kwargs['ti'].xcom_push(key='filtroFalse', value=fc)

def modifyValue(lista, **kwargs):

    table = kwargs['ti'].xcom_pull(key='filtroTrue')   
    
    for i in table['features']:
        i['properties'][lista[0]] = lista[1]

    kwargs['ti'].xcom_push(key='modificaValor', value=table)

def mergeTable( **kwargs):

    fc = kwargs['ti'].xcom_pull(key='modificaValor')
    fc2 = kwargs['ti'].xcom_pull(key='filtroFalse')   
    
    for i in fc2['features']:
        fc['features'].append(i)

    kwargs['ti'].xcom_push(key='fusionaTablas', value=fc)


def isNumber(value):
    try:
        float(value)
        return "_"+value
    except:
        return value


#funcion que introduce un geojson en postgis
def dataToPostGIS(dicc, table, **kwargs):

    #Se recuperan las variables XCOM
    fc = kwargs['ti'].xcom_pull(key='fusionaTablas')
    epsg = kwargs['ti'].xcom_pull(key='LeeSHP_EPSG')


    tableName = table.lower()
    #Se empieza a crear las instancias para crear e insertar
    sqlCreate="CREATE TABLE IF NOT EXISTS "+tableName+" ("
    sqlInsert = "INSERT INTO "+tableName+" ("

    #Se cuentan las filas del geojson
    rows = len(fc['features'])

    lon = len(fc['features'][0]['properties'])

    dicKeys = fc['features'][0]['properties']

    listKeys =[]
    listKeysLower =[]
    #se recorren las columnas para complementar las instancias
    for t in dicKeys.keys():
        if t.lower() not in listKeysLower:
            listKeys.append(t)
            listKeysLower.append(t.lower())

    for i in listKeys:

        attr = isNumber(i)

        sqlCreate = sqlCreate + attr.lower().replace(": ","_")
        sqlInsert = sqlInsert + attr.lower().replace(": ","_")+","

        longitud=0
        tipo = 'None'

        #se reocrren las filas para complementar las instancias
        for j in range(0,rows):

            value = fc['features'][j]['properties'][i]

            if type(value) is int:
                if tipo=='None':
                    tipo = 'INTEGER'
                    longitud = len(str(value))

                elif longitud < len(str(value)):
                    longitud = len(str(value))

            if type(value) is float:
                if tipo=='None':
                    tipo = 'FLOAT'
                    longitud = len(str(value).split(".")[-1])

                elif tipo== 'INTEGER':
                    tipo = 'FLOAT'
                    if longitud < len(str(value).split(".")[-1]):
                        longitud = len(str(value).split(".")[-1])              
                
            if type(value) is str:
                if tipo=='None':
                    tipo = 'VARCHAR'
                    longitud=len(value)
                
                else:
                    tipo='VARCHAR'
                    
                    if longitud < len(value):
                        longitud=len(value)

        if tipo == 'INTEGER':
            sqlCreate = sqlCreate+' '+tipo+', '
        else:
            sqlCreate = sqlCreate+' '+tipo+'('+str(longitud)+'), '
        
    sqlCreate=sqlCreate[:-2]+')'

    #Se crea conexion y cursor para conectar a postgres
    conn = psycopg2.connect(user = dicc["user"], password = dicc["password"], host = dicc["host"], port = dicc["port"], database = dicc["database"])
    cur = conn.cursor()

    #se ejecuta la instancia para crear tabla
    cur.execute(sqlCreate)

    #Añade geometría a la tabla creada si no tiene ya
    try:
        addGeomCol = "SELECT AddGeometryColumn ('%s', 'geom', %s, '%s', %s)" %(tableName, epsg, "GEOMETRY", 2)
        cur.execute(addGeomCol)
    except:
        print("Ya existe geometria en la tabla")

    #se sigue con la instancia de insercion
    sqlInsert = sqlInsert+'geom) VALUES ('

    #segundo bucle para introducir valores y geometría
    #se recorren filea
    for k in range(0, rows):

        sqlInsert2=sqlInsert

        #geometría en geojson
        coord = str(fc['features'][k]['geometry']).replace("'", '"')

        #se recorren columnas
        for attr in listKeys:
            
            value = fc['features'][k]['properties'][attr]
            
            if type(value) is str and value !='NULL':
                sqlInsert2 = sqlInsert2+"'"+str(value).replace("'", "''")+"',"
            else:
                sqlInsert2 = sqlInsert2+ str(value)+','
        
        #Instancia final para introudcir datos a postgis
        sqlInsert2=sqlInsert2+"ST_SetSRID(ST_GeomFromGeoJSON('"+str(coord)+"'), "+ epsg+") )"

        #se ejecuta la instancia de insercion
        cur.execute(sqlInsert2)

    #se cierra la conexion y el cursor
    conn.commit()
    conn.close()
    cur.close()



#argumentos del DAG (los 2 necesarios)
args = {
    'owner': 'Scolab',
    'start_date': days_ago(1),
}

#Se crea el DAG
dag = DAG(
    dag_id='join_tables_python_operator',
    default_args=args,
    schedule_interval=None,
    tags=['joinTables']
)



#Diccionarios con parámetros necesarios
diccExcel= {"sheet_name" : "Tabela", "header" : 4, "usecols" : "A:E", "ruta" : "/home/scolab//Documentos/datos/Tocantins/3.3.4.12. Perfil Socioeconômico/Demografia/Populacao_Censitaria_Munici_Tocantins_1991_2000_2010.xlsx"}

diccSHP = {"attributes" : [], "ruta" : "/home/scolab/Documentos/datos/Tocantins/Limites_Municipais/Limites_Municipais.shp"}

diccPostgisParam = {"user" : "postgres", "password" : "postgres", "host" : "localhost", "port" : "5432", "database" : "postgres_db"}

diccAttr = {"0": "COD_IBGE", "1" : "Unnamed: 0"}

listaCambioAttr = ['1991','pop_1991','2000', 'pop_2000', '2010', 'pop_2010']
listaEliminaAttr = ['Unnamed: 0', 'Unnamed: 1']




task1 = PythonOperator(
    task_id='read_excel',
    provide_context=True,
    python_callable=readExcel,
    op_kwargs=diccExcel,
    dag=dag,
)

#Tarea 1, se lanza para leer un shp y convertirlo a geojson
task2 = PythonOperator(
    task_id='read_shapefile',
    provide_context=True,
    python_callable=readSHP,
    op_kwargs=diccSHP,
    dag=dag,
)

task3 = PythonOperator(
    task_id='join_tables',
    provide_context=True,
    python_callable=joinTables,
    op_kwargs=diccAttr,
    dag=dag,
)


task4 = PythonOperator(
    task_id='rename_attributes',
    provide_context=True,
    python_callable=renameAttr,
    op_args=[listaCambioAttr],
    dag=dag,
)

task5 = PythonOperator(
    task_id='remove_attributes',
    provide_context=True,
    python_callable=removeAttr,
    op_args=[listaEliminaAttr],
    dag=dag,
)

listaFilterAttr = ['pop_1991','...']

task6 = PythonOperator(
    task_id='filter',
    provide_context=True,
    python_callable=filter,
    op_args=[listaFilterAttr],
    dag=dag,
)

listaValor = ["pop_1991", 'NULL']

task7 = PythonOperator(
    task_id='modify_value',
    provide_context=True,
    python_callable=modifyValue,
    op_args=[listaValor],
    dag=dag,
)


task8 = PythonOperator(
    task_id='merge_tables',
    provide_context=True,
    python_callable=mergeTable,
    dag=dag,
)


#Tarea 2, recoge geojson y lo convierte a postgis
task9 = PythonOperator(
    task_id='insert_to_postgis',
    provide_context=True,
    python_callable=dataToPostGIS,
    op_args=[diccPostgisParam, "pob_cens_toc"],
    dag=dag,
)

[task2, task1] >> task3 >> task4 >> task5 >> task6 >> task7 >> task8 >>task9
task6 >> task8
