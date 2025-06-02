from flask import Flask, request, jsonify
from transformers import pipeline
import json
from flask_cors import CORS

with open("categorias.json", "r", encoding="utf-8") as f:
    CATEGORIAS = json.load(f)

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def categorizar_empresa(descripcion):
    print("Iniciando categorización...")
    print(f"Descripción a analizar: {descripcion[:100]}...")
    
    # Cargar el modelo de clasificación (primera vez puede demorar)
    print("Cargando modelo de clasificación...")
    classifier = pipeline("zero-shot-classification", 
                         model="facebook/bart-large-mnli")
    
    print("Realizando clasificación...")
    # Clasificar el texto según las categorías
    result = classifier(descripcion, CATEGORIAS, multi_label=True)
       
    # Obtener las 3 categorías con mayor puntuación
    top_categorias = []
    top_scores = []
    
    for i in range(3):
        categoria = result["labels"][i]
        score = result["scores"][i]
        top_categorias.append(categoria)
        top_scores.append(score)
        print(f"Categoría #{i+1}: {categoria} (confianza: {score:.4f})")
    
    return top_categorias