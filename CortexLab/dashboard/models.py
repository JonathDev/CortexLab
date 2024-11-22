from mongoengine import Document, EmbeddedDocument, StringField, ListField, EmbeddedDocumentField, DateTimeField

class ColumnData(EmbeddedDocument):
    name = StringField(required=True)  # Nom de la colonne
    values = ListField()               # Liste des valeurs de la colonne

class Project(Document):
    user_id = StringField(required=True)
    name = StringField(max_length=255, required=True)
    model_type = StringField(max_length=50, choices=[
        ('clustering', 'Clustering'),
        ('regression', 'Régression'),
        ('classification', 'Classification'),
    ], required=False, null=True)
    columns = ListField(EmbeddedDocumentField(ColumnData), default=list)  # Toutes les colonnes avec leurs valeurs
    target = StringField(required=False, null=True)  # Nom de la colonne cible
    features = ListField(StringField(), default=list)  # Liste des noms des colonnes sélectionnées comme features
    created_at = DateTimeField()
    description = StringField(max_length=255, required=False)
    meta = {
        'collection': 'project',
        'db_alias': 'default',
    }


"""
class Project(Document):
    user_id = StringField(required=True)
    name = StringField(max_length=255, required=True)
    model_type = StringField(max_length=50, choices=[
        ('clustering', 'Clustering'),
        ('regression', 'Régression'),
        ('classification', 'Classification'),
    ], required=False)
    features = DictField(default=dict, blank=True, null=True)
    target = DictField(default=dict, blank=True, null=True)
    trained_model = BinaryField(default=b'', blank=True, null=True)
    created_at = DateTimeField()
    description = StringField(max_length=255, required=False)
    meta = { 
        'collection': 'project',
        'db_alias': 'default',  # Assurez-vous que c'est l'alias correct
    }
    
    def __str__(self):
        return self.name
"""
