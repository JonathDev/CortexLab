
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

    const csrfToken = getCSRFToken(); // Récupération du CSRF token depuis les cookies

    // Gestion du formulaire d'upload (Étape 1)
    const uploadForm = document.getElementById("uploadForm");
    if (uploadForm) {
        uploadForm.onsubmit = async function (event) {
            event.preventDefault();
            let formData = new FormData(uploadForm);

            const response = await fetch(uploadForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Colonnes détectées :", data.columns);

                const columnsList = document.getElementById("columnsList");
                const targetSelect = document.getElementById("target");
                const featuresList = document.getElementById("featuresList");

                // Vider les listes existantes
                columnsList.innerHTML = "";
                targetSelect.innerHTML = "";
                featuresList.innerHTML = "";

                // Ajouter les colonnes détectées
                data.columns.forEach(column => {
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

                // Afficher les sections pertinentes
                document.getElementById("columnsSection").style.display = "block";
                document.getElementById("targetForm").style.display = "block";
                document.getElementById("featuresForm").style.display = "block";
            } else {
                console.error("Erreur lors du téléversement :", await response.text());
            }
        };
    }

    // Gestion du formulaire du type de modèle (Étape 2)
    const modelTypeForm = document.getElementById("modelTypeForm");
    if (modelTypeForm) {
        modelTypeForm.onsubmit = async function (event) {
            event.preventDefault();
            const modelType = document.getElementById("model_type").value;

            const response = await fetch(modelTypeForm.dataset.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken, // Utiliser le CSRF token récupéré
                },
                body: JSON.stringify({ model_type: modelType }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);

                // Mettre à jour uniquement l'affichage du modèle sans recharger la page
                const selectedModelDisplay = document.getElementById("selectedModelDisplay");
                if (selectedModelDisplay) {
                    selectedModelDisplay.textContent = modelType;
                }
            } else {
                const error = await response.json();
                alert("Erreur : " + error.message);
            }
        };
    }

    // Gestion du formulaire target (Étape 3)
    const targetForm = document.getElementById("targetForm");
    if (targetForm) {
        targetForm.onsubmit = async function (event) {
            event.preventDefault();
            let formData = new FormData(targetForm);
            const response = await fetch(targetForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
            } else {
                console.error("Erreur lors de la définition de la cible :", await response.text());
            }
        };
    }

    // Gestion du formulaire features (Étape 4)
    const featuresForm = document.getElementById("featuresForm");
    if (featuresForm) {
        featuresForm.onsubmit = async function (event) {
            event.preventDefault();
            let formData = new FormData(featuresForm);
            const response = await fetch(featuresForm.dataset.url, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": csrfToken },
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
            } else {
                console.error("Erreur lors de la définition des caractéristiques :", await response.text());
            }
        };
    }
});
