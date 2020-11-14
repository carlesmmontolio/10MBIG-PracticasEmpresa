import pandas as pd
import psycopg2

from airflow.models import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago


#Funcion para leer un excel
def readExcel(**kwargs):

    dicc=kwargs

    #Se lee con pandas y se pasa a diccionario
    xl = pd.read_excel(dicc["ruta"], sheet_name=dicc["sheet_name"], header=dicc["header"], usecols=dicc["usecols"]).to_dict()

    #Se guarda como variable XCOM
    kwargs['ti'].xcom_push(key='LeeExcel', value=xl)
            

#Funcion para pasar diccionario (sin geometría) a una tabla postgres
def dataToPostgres(dicc, tableName, **kwargs):

    #Se recogen los datos XCOM
    data = kwargs['ti'].xcom_pull(key='LeeExcel')

    #Instacians para crear e insertar tablas
    sqlCreate="CREATE TABLE IF NOT EXISTS "+tableName.lower()+" ("

    sqlInsert = "INSERT INTO "+tableName.lower()+" ("

    #se recorren las columnas para crear la instancia de crear tabla
    #en funcion de si es string o integer (hay que implementar el resto de tipos o si no pasarselo como variable)
    #Se empieza también a crear la instancia insert
    for i in data:
        
        sqlCreate=sqlCreate+i.lower()
        sqlInsert=sqlInsert+i.lower()+","

        longitud=0
        tipo = 'None'
        rows= len(data[i])
        
        for j in range(0,rows):

            if type(data[i][j]) is int:
                if tipo=='None':
                    tipo = 'INTEGER'
            
            if type(data[i][j]) is str:
                if tipo=='None':
                    tipo = 'VARCHAR'
                    longitud=len(data[i][j])
                elif longitud < len(data[i][j]):
                        longitud=len(data[i][j])
        
        if tipo == 'INTEGER':
            sqlCreate = sqlCreate+' '+tipo+', '
        elif tipo == 'VARCHAR':
            sqlCreate = sqlCreate+' '+tipo+'('+str(longitud)+'), '
    
    sqlCreate=sqlCreate[:-2]+')'
 
    sqlInsert = sqlInsert[:-1]+') VALUES ('

    #Se crea conexion y cursor para conectar a postgres
    conn = psycopg2.connect(user = dicc["user"], password = dicc["password"], host = dicc["host"], port = dicc["port"], database = dicc["database"])
    cur = conn.cursor()

    #se ejecuta la instancia para crear tabla
    cur.execute(sqlCreate)
 
    #Se va creando las instancias para insertar los datos y ejecutando
    for k in range(0, rows):
        sqlInsert2=sqlInsert
        for l in data:
            if type(data[l][k]) is str:
                sqlInsert2 = sqlInsert2+"'"+str(data[l][k])+"',"
            else:
                sqlInsert2 = sqlInsert2+ str(data[l][k])+','
            
        sqlInsert2=sqlInsert2[:-1]+')'
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
    dag_id='excel_to_postgres_python_operator',
    default_args=args,
    schedule_interval=None,
    tags=['excelToPostgres']
)

#Diccionarios con parámetros necesarios
diccExcel= {"sheet_name" : "ine", "header" : 0, "usecols" : "A,B", "ruta" : "/home/scolab/Documentos/codigosINE.xlsx"}

diccPostgresParams = {"user" : "postgres", "password" : "postgres", "host" : "localhost", "port" : "5432", "database" : "postgres_db"}

#Tarea 1, llama a la función que lee el excel. Se le pasa el diccionario con los parámetros del excel
task1 = PythonOperator(
    task_id='read_the_excel',
    provide_context=True,
    python_callable=readExcel,
    op_kwargs=diccExcel,
    dag=dag,
)

#Tarea 2, llama a la segunda función, se le pasa un diccionario con los parámetros de postgres, el nombre de la tabla (la hoja de excel)
task2 = PythonOperator(
    task_id='insert_to_postgres',
    provide_context=True,
    python_callable=dataToPostgres,
    op_args=[diccPostgresParams, diccExcel["sheet_name"]],
    dag=dag,
)

#Orden de las tareas
task1 >> task2
