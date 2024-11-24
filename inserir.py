from pymongo import MongoClient

# Conexão com o MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["cremoso"]  # Nome do banco de dados
collection = db["menuitems"]  # Nome da coleção

# Dados dos Sabores Especiais +
sabores_especiais_plus = {
    "category": "Sabores Especiais +",
    "price": 10,  # Valor sugerido para os sabores especiais +
    "items": [
        {"name": "Açaí", "description": "Sorvete sabor açaí, sem lactose."},
        {"name": "Ameixa", "description": "Sorvete sabor ameixa, doce e frutado."},
        {"name": "Camafeu", "description": "Sorvete sabor doce de nozes com leite condensado."},
        {"name": "Casadinho", "description": "Sorvete sabor tradicional casadinho."},
        {"name": "Casadinho com Leite Ninho e Nutella", "description": "Sorvete casadinho com leite Ninho e creme de avelã."},
        {"name": "Casadinho com Leite Ninho e Trufa", "description": "Sorvete casadinho com leite Ninho e recheio de trufa."},
        {"name": "Extra Dark", "description": "Sorvete sabor chocolate extra amargo, intenso e sofisticado."},
        {"name": "Ferrero Rocher", "description": "Sorvete inspirado no famoso bombom Ferrero Rocher."},
        {"name": "Mil Amores", "description": "Sorvete clássico com um toque especial de amor."},
        {"name": "Nutella", "description": "Sorvete sabor creme de avelã com cacau."},
        {"name": "Nutella Branca", "description": "Sorvete sabor creme de avelã branco, suave e delicioso."}
    ]
}

# Inserindo os dados no MongoDB
result = collection.insert_one(sabores_especiais_plus)

# Verifica o ID do documento inserido
print(f"Categoria Sabores Especiais + inserida com sucesso. ID: {result.inserted_id}")
