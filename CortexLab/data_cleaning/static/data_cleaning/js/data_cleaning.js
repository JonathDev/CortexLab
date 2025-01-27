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
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                // Mise à jour des colonnes
                datasetHeaders.innerHTML = "<th>#</th>"; // Colonne pour les numéros de ligne
                data.columns.forEach(col => {
                    const th = document.createElement("th");
                    th.textContent = col;
                    datasetHeaders.appendChild(th);
                });

                // Mise à jour des lignes
                datasetRows.innerHTML = "";
                data.rows.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${row.row_id}</td>`; // Colonne pour le numéro de ligne
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