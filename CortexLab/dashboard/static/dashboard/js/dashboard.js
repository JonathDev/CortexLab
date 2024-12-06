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
    console.log('ca passe par la')
    console.log("JavaScript chargé avec succès !");

    // Intercepter toutes les soumissions de formulaire
    document.addEventListener("submit", async function (event) {
        const form = event.target;

        // Vérifiez si le formulaire est celui que vous voulez intercepter
        if (form.id === "uploadForm") {
            event.preventDefault(); // Bloque la redirection
            console.log("Soumission interceptée depuis le formulaire :", form.id);

            const formData = new FormData(form);
            const url = form.action; // Utilisez l'attribut action

            console.log("Données envoyées :", Array.from(formData.entries()));
            console.log("URL de la requête :", url);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Réponse JSON :", data);

                    // Ajoutez dynamiquement la carte du dataset
                    addDatasetCard(data.dataset);

                    // Affichez un message de succès
                    showSuccessMessage("Fichier téléchargé avec succès !");
                } else {
                    const errorText = await response.text();
                    console.error("Erreur lors de l'envoi :", errorText);
                    showErrorMessage("Une erreur s'est produite lors de l'analyse des données.");
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
            }
        }
    });

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

    function addDatasetCard(dataset) {
        const datasetsContainer = document.querySelector(".row.g-3");
        if (!datasetsContainer) {
            console.error("Container des datasets introuvable.");
            return;
        }

        const card = `
            <div class="col-md-4">
                <div class="card dataset-card shadow-sm">
                    <div class="row g-0 align-items-center">
                        <div class="col-3 text-center">
                            <img src="/static/dashboard/icons/dataset-icon.webp" alt="Dataset Icon" class="img-fluid dataset-icon">
                        </div>
                        <div class="col-9">
                            <div class="card-body">
                                <h6 class="card-title">${dataset.name}</h6>
                                <p class="card-text"><small>Date : ${dataset.uploaded_at}</small></p>
                                <p class="card-text"><small>Colonnes : ${dataset.columns.length}</small></p>
                                <button class="btn btn-primary btn-sm">Nettoyer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        datasetsContainer.insertAdjacentHTML("beforeend", card);
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
