// Fonction pour récupérer le CSRF token depuis les cookies
function getCSRFToken() {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "csrftoken") {
            return value;
        }
    }
    return null;
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript chargé avec succès !");
    const csrfToken = getCSRFToken();
    console.log("CSRF Token récupéré :", csrfToken);

    // Vérifier l'existence des formulaires et des sections HTML
    const uploadForm = document.getElementById("uploadForm");
    const modelTypeForm = document.getElementById("modelTypeForm");
    const targetForm = document.getElementById("targetForm");
    const featuresForm = document.getElementById("featuresForm");

    if (!uploadForm || !modelTypeForm || !targetForm || !featuresForm) {
        console.error("Certains formulaires ou éléments HTML nécessaires sont introuvables.");
        return;
    }

    /**
     * Gestion du formulaire d'upload (Étape 1)
     */
    uploadForm.onsubmit = async function (event) {
        event.preventDefault();
        console.log("Début de l'envoi des données pour analyse...");
        let formData = new FormData(uploadForm);
        console.log("Données du formulaire :", Object.fromEntries(formData.entries()));

        try {
            const response = await fetch(uploadForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            console.log("Réponse reçue :", response);

            if (response.ok) {
                const data = await response.json();
                console.log("Colonnes détectées :", data.columns);
                updateColumnList(data.columns);
            } else {
                const errorText = await response.text();
                console.error("Erreur lors de l'analyse des données :", errorText);
                showErrorMessage("Erreur lors de l'analyse des données.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
        }
    };

    /**
     * Gestion du formulaire de sélection du type de modèle (Étape 2)
     */
    modelTypeForm.onsubmit = async function (event) {
        event.preventDefault();
        const modelType = document.getElementById("model_type").value;
        console.log("Type de modèle sélectionné :", modelType);

        try {
            const response = await fetch(modelTypeForm.dataset.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({ model_type: modelType }),
            });

            console.log("Réponse reçue :", response);

            if (response.ok) {
                const data = await response.json();
                console.log("Type de modèle enregistré :", data);
                showSuccessMessage(data.message);
                updateModelType(modelType);
            } else {
                const errorText = await response.text();
                console.error("Erreur lors de l'enregistrement du type de modèle :", errorText);
                showErrorMessage("Erreur lors de l'enregistrement du type de modèle.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
        }
    };

    /**
     * Gestion du formulaire de sélection de la target (Étape 3)
     */
    targetForm.onsubmit = async function (event) {
        event.preventDefault();
        let formData = new FormData(targetForm);
        console.log("Cible sélectionnée :", Object.fromEntries(formData.entries()));

        try {
            const response = await fetch(targetForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            console.log("Réponse reçue :", response);

            if (response.ok) {
                const data = await response.json();
                console.log("Target enregistrée :", data);
                showSuccessMessage(data.message);
                updateTarget(formData.get("target"));
            } else {
                const errorText = await response.text();
                console.error("Erreur lors de l'enregistrement de la target :", errorText);
                showErrorMessage("Erreur lors de l'enregistrement de la target.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
        }
    };

    /**
     * Gestion du formulaire de sélection des features (Étape 4)
     */
    featuresForm.onsubmit = async function (event) {
        event.preventDefault();
        let formData = new FormData(featuresForm);
        console.log("Caractéristiques sélectionnées :", [...formData.getAll("features")]);

        try {
            const response = await fetch(featuresForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            console.log("Réponse reçue :", response);

            if (response.ok) {
                const data = await response.json();
                console.log("Features enregistrées :", data);
                showSuccessMessage(data.message);
                updateFeatures([...formData.getAll("features")]);
            } else {
                const errorText = await response.text();
                console.error("Erreur lors de l'enregistrement des features :", errorText);
                showErrorMessage("Erreur lors de l'enregistrement des features.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
        }
    };

    // Fonctions utilitaires pour mettre à jour l'interface utilisateur
    function updateColumnList(columns) {
        console.log("Mise à jour des colonnes avec :", columns);
        const columnsList = document.getElementById("columnsList");
        const targetSelect = document.getElementById("target");
        const featuresList = document.getElementById("featuresList");

        columnsList.innerHTML = "";
        targetSelect.innerHTML = "";
        featuresList.innerHTML = "";

        columns.forEach(column => {
            const li = document.createElement("li");
            li.textContent = column;
            columnsList.appendChild(li);

            const option = document.createElement("option");
            option.value = column;
            option.textContent = column;
            targetSelect.appendChild(option);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "features";
            checkbox.value = column;

            const label = document.createElement("label");
            label.textContent = column;

            featuresList.appendChild(checkbox);
            featuresList.appendChild(label);
            featuresList.appendChild(document.createElement("br"));
        });

        document.getElementById("columnsSection").style.display = "block";
        document.getElementById("targetForm").style.display = "block";
        document.getElementById("featuresForm").style.display = "block";
    }

    function updateModelType(modelType) {
        console.log("Mise à jour du type de modèle :", modelType);
        const modelTypeField = document.getElementById("modelTypeSummary");
        if (modelTypeField) modelTypeField.textContent = modelType;
    }

    function updateTarget(target) {
        console.log("Mise à jour de la target :", target);
        const targetField = document.getElementById("targetSummary");
        if (targetField) targetField.textContent = target;
    }

    function updateFeatures(features) {
        console.log("Mise à jour des features :", features);
        const featuresField = document.getElementById("featuresSummary");
        if (featuresField) featuresField.textContent = features.join(", ");
    }

    function showSuccessMessage(message) {
        console.log("Message de succès :", message);
        alert(message);
    }

    function showErrorMessage(message) {
        console.error("Message d'erreur :", message);
        alert(message);
    }
});
