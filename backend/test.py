from sqlalchemy import create_engine, Column, Integer, String, text

DATABASE_URL = "postgresql://keshav:Keshav%40123@localhost:5432/books"

engine = create_engine(DATABASE_URL, echo=True)

with engine.connect() as connection:
    result = connection.execute(text("select * from books"))
    rows = result.fetchall()
print("The fetched results: ")
print(rows)