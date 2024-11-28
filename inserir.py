from pymongo import MongoClient
from pymongo.errors import BulkWriteError

# Conectar ao MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client.cremoso

# Definir a coleção
special_products_collection = db.special_products

# Produtos a serem inseridos
products = [
    {"name": "Bolo", "basePrice": 10},
    {"name": "Brownie", "basePrice": 5},
    {"name": "Petit Gateau", "basePrice": 25},
    {"name": "Diversos", "basePrice": 0},  # Preço definido pelo usuário ou padrão
]

# Inserir produtos
try:
    special_products_collection.insert_many(products, ordered=False)
    print("Produtos inseridos com sucesso!")
except BulkWriteError as bwe:
    print("Erro ao inserir produtos:", bwe.details)

# Fechar a conexão
client.close()
