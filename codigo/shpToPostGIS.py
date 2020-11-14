from osgeo import ogr, osr
import psycopg2


from airflow.models import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago


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
    kwargs['ti'].xcom_push(key='LeeSHP_NomTabla', value=layer_name.lower())


#funcion que introduce un geojson en postgis
def dataToPostGIS(dicc, diccSHP, **kwargs):

    #Se recuperan las variables XCOM
    fc = kwargs['ti'].xcom_pull(key='LeeSHP')
    epsg = kwargs['ti'].xcom_pull(key='LeeSHP_EPSG')
    tableName =  kwargs['ti'].xcom_pull(key='LeeSHP_NomTabla')

    #Se empieza a crear las instancias para crear e insertar
    sqlCreate="CREATE TABLE IF NOT EXISTS "+tableName+" ("
    sqlInsert = "INSERT INTO "+tableName+" ("

    #Se cuentan las filas del geojson
    rows = len(fc['features'])

    #se recorren las columnas para complementar las instancias
    for i in range (0, len(diccSHP["attributes"])):
        
        attr = diccSHP["attributes"][i]

        sqlCreate = sqlCreate + attr.lower()
        sqlInsert = sqlInsert + attr.lower()+","

        longitud=0
        tipo = 'None'

        #se reocrren las filas para complementar las instancias
        for j in range(0,rows):

            value = fc['features'][j]['properties'][attr]

            if type(value) is int:
                if tipo=='None':
                    tipo = 'INTEGER'
                
            if type(value) is str:
                if tipo=='None':
                    tipo = 'VARCHAR'
                    longitud=len(value)
                elif longitud < len(value):
                    longitud=len(value)

        if tipo == 'INTEGER':
            sqlCreate = sqlCreate+' '+tipo+', '
        elif tipo == 'VARCHAR':
            sqlCreate = sqlCreate+' '+tipo+'('+str(longitud)+'), '

    sqlCreate=sqlCreate[:-2]+')'

    #Se crea conexion y cursor para conectar a postgres
    conn = psycopg2.connect(user = dicc["user"], password = dicc["password"], host = dicc["host"], port = dicc["port"], database = dicc["database"])
    cur = conn.cursor()

    #se ejecuta la instancia para crear tabla
    cur.execute(sqlCreate)

    #Entero que define la dimension de la capa
    coordDim = len(fc['features'][0]['geometry']['coordinates'][0][0])

    #Añade geometría a la tabla creada si no tiene ya
    try:
        addGeomCol = "SELECT AddGeometryColumn ('%s', 'geom', %s, '%s', %s)" %(tableName, epsg, "GEOMETRY", coordDim)
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
        for l in range (0, len(diccSHP["attributes"])):
            
            attr = diccSHP["attributes"][l]
            
            value = fc['features'][k]['properties'][attr]
            
            if type(value) is str:
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
    dag_id='shp_to_postgis_python_operator',
    default_args=args,
    schedule_interval=None,
    tags=['shpToPostGIS']
)

#Diccionarios con parametros
diccSHP = {"attributes" : ["CODIGOINE", "NOMBRE"], "ruta" : "/home/scolab/Documentos/terminos/TerminosCV_cnig.shp"}

diccPostgisParam = {"user" : "postgres", "password" : "postgres", "host" : "localhost", "port" : "5432", "database" : "postgres_db"}

#Tarea 1, se lanza para leer un shp y convertirlo a geojson
task1 = PythonOperator(
    task_id='shape_to_geojson',
    provide_context=True,
    python_callable=readSHP,
    op_kwargs=diccSHP,
    dag=dag,
)

#Tarea 2, recoge geojson y lo convierte a postgis
task2 = PythonOperator(
    task_id='insert_to_postgis',
    provide_context=True,
    python_callable=dataToPostGIS,
    op_args=[diccPostgisParam,diccSHP],
    dag=dag,
)

task1 >> task2
