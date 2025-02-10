document.addEventListener("DOMContentLoaded", function () {
    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetHeaders = document.querySelector("#dataset-headers");
    const datasetRows = document.querySelector("#dataset-rows");

    if (!datasetSelector) {
        console.error("Erreur : Le sélecteur de datasets est introuvable.");
        return;
    }

    // Événement pour changer le dataset
    datasetSelector.addEventListener("change", function () {
        const datasetId = this.value;
        if (!datasetId) return;

        console.log(`Chargement du dataset ID : ${datasetId}`);

        fetch(`/data_cleaning/load_dataset/${datasetId}/`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                console.log("Dataset chargé :", data);

                // Mise à jour des colonnes
                datasetHeaders.innerHTML = "<th>#</th>";
                data.columns.forEach(col => {
                    const th = document.createElement("th");
                    th.innerHTML = `
                        ${col}
                        <button class="btn btn-sm btn-light filter-btn" data-column="${col}" title="Filtrer">
                            <i class="bi bi-filter"></i>
                        </button>
                    `;
                    datasetHeaders.appendChild(th);
                });

                // Mise à jour des lignes
                datasetRows.innerHTML = "";
                data.rows.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${row.row_id}</td>`;
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

    // Fonction pour ouvrir la modale
    function openFilterModal(columnName) {
        console.log("Ouverture de la modale pour la colonne :", columnName);
    
        const datasetSelector = document.querySelector("#dataset-selector");
        const datasetId = datasetSelector.value;
    
        fetch(`/data_cleaning/get_column_type/${datasetId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({ column_name: columnName }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Erreur serveur :", data.error);
                    return;
                }
    
                // Remplir les informations dans la modale
                document.getElementById("filter-column-name").textContent = columnName;
                document.getElementById("filter-column-type").textContent = data.column_type;
                document.getElementById("filter-null-count").textContent = data.null_count;
    
                // Trier les valeurs uniques par pourcentage décroissant et afficher les 4 premières
                const uniqueValuesList = document.getElementById("filter-unique-values");
                uniqueValuesList.innerHTML = ""; // Vider les anciennes valeurs
                const sortedValues = Object.entries(data.unique_values).sort((a, b) => b[1] - a[1]); // Trier par pourcentage
                const top4Values = sortedValues.slice(0, 4); // Garder les 4 premières
    
                top4Values.forEach(([value, percentage]) => {
                    const li = document.createElement("li");
                    li.textContent = `${value}: ${percentage.toFixed(2)}%`;
                    uniqueValuesList.appendChild(li);
                });
    
                // Montrer les options de filtrage correspondantes
                document.getElementById("numeric-filter-options").style.display = data.column_type === "numérique" ? "block" : "none";
                document.getElementById("text-filter-options").style.display = data.column_type === "texte" ? "block" : "none";
                document.getElementById("date-filter-options").style.display = data.column_type === "date" ? "block" : "none";
    
                // Afficher la modale
                const filterModal = new bootstrap.Modal(document.getElementById("filterModal"));
                filterModal.show();
            })
            .catch(error => console.error("Erreur lors du chargement des informations :", error));
    }
    
    
    
    // Gestion des clics sur le bouton de filtrage
    document.addEventListener("click", function (event) {
        const filterBtn = event.target.closest(".filter-btn");
        if (filterBtn) {
            const columnName = filterBtn.dataset.column;
            openFilterModal(columnName);
        }
    });

    // Récupération du CSRF token
    function getCSRFToken() {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") {
                return value;
            }
        }
        return null;
    }
});
