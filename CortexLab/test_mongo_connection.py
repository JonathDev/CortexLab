# test_mongo_connection.py

from mongoengine import connect, Document, StringField

class TestDocument(Document):
    name = StringField()

    meta = {'collection': 'test_document'}

def test_connection():
    connect(
        db='cortexlab_db',
        host='localhost',
        port=27017,
        username='projetclient',
        password='clientmongo',
        authentication_source='admin',  # Utiliser 'admin' car l'utilisateur admin est dans 'admin'
        alias='default'
    )
    doc = TestDocument(name="Test")
    doc.save()
    print("Connexion réussie et document sauvegardé.")

if __name__ == "__main__":
    test_connection()
