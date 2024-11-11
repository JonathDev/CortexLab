# dashboard/models.py

from mongoengine import Document, StringField, DictField, DateTimeField, BinaryField

class Project(Document):
    user_id = StringField(required=True)
    name = StringField(max_length=255, required=True)
    model_type = StringField(max_length=50, choices=[
        ('clustering', 'Clustering'),
        ('regression', 'Régression'),
        ('classification', 'Classification'),
    ], required=True)
    features = DictField(default=dict, blank=True, null=True)
    target = DictField(default=dict, blank=True, null=True)
    trained_model = BinaryField(default=b'', blank=True, null=True)
    created_at = DateTimeField()
    
    meta = {
        'collection': 'project',
        'db_alias': 'default',  # Assurez-vous que c'est l'alias correct
    }
    
    def __str__(self):
        return self.name
