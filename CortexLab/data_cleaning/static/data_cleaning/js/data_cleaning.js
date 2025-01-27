document.addEventListener("DOMContentLoaded", function () {
    const datasetsContainer = document.querySelector("#selected-datasets-container");

    if (!datasetsContainer) {
        console.error("Erreur : Le conteneur des datasets sélectionnés est introuvable.");
        return;
    }

    // Appel au backend pour récupérer les datasets sélectionnés
    fetch("/data_cleaning/get_selected_datasets/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des datasets.");
            }
            return response.json();
        })
        .then(data => {
            if (data.datasets && data.datasets.length > 0) {
                // Efface le contenu existant
                datasetsContainer.innerHTML = "";

                // Ajoute les datasets récupérés
                data.datasets.forEach(dataset => {
                    const item = `
                        <div class="list-group-item">
                            <strong>${dataset.name}</strong><br>
                            <small>Colonnes : ${dataset.columns.length}</small><br>
                            <small>Uploadé le : ${dataset.uploaded_at}</small>
                        </div>
                    `;
                    datasetsContainer.insertAdjacentHTML("beforeend", item);
                });
            } else {
                datasetsContainer.innerHTML = "<p class='text-muted'>Aucun dataset sélectionné.</p>";
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des datasets :", error);
            datasetsContainer.innerHTML = "<p>Une erreur est survenue lors de la récupération des datasets.</p>";
        });
});


document.addEventListener("DOMContentLoaded", function () {
    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetHeaders = document.querySelector("#dataset-headers");
    const datasetRows = document.querySelector("#dataset-rows");

    if (!datasetSelector) {
        console.error("Erreur : Le sélecteur de datasets est introuvable.");
        return;
    }

    // Écoute l'événement "change" sur le sélecteur
    datasetSelector.addEventListener("change", function () {
        const datasetId = this.value; // Récupère l'ID du dataset sélectionné
        if (!datasetId) return;

        // Appel à la vue Django pour charger le dataset sélectionné
        fetch(`/data_cleaning/load_dataset/${datasetId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors du chargement des données.");
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                // Mise à jour de la table avec les données du dataset
                datasetHeaders.innerHTML = "";
                data.columns.forEach(col => {
                    const th = document.createElement("th");
                    th.textContent = col;
                    datasetHeaders.appendChild(th);
                });

                datasetRows.innerHTML = "";
                data.rows.forEach(row => {
                    const tr = document.createElement("tr");
                    data.columns.forEach(col => {
                        const td = document.createElement("td");
                        td.textContent = row[col] || "N/A";
                        tr.appendChild(td);
                    });
                    datasetRows.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("Erreur lors du chargement des données :", error);
                alert("Erreur réseau, veuillez réessayer.");
            });
    });
});
