// 📌 Fonction pour récupérer le token CSRF depuis les cookies
function getCSRFToken() {
    console.log("📌 Récupération du token CSRF...");
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "csrftoken") {
            console.log("✅ Token CSRF trouvé !");
            return value;
        }
    }
    console.warn("❌ Avertissement : Aucun token CSRF trouvé !");
    return null;
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 data_cleaning.js chargé !");

    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetHeaders = document.querySelector("#dataset-headers");
    const datasetRows = document.querySelector("#dataset-rows");

    if (!datasetSelector || !datasetHeaders || !datasetRows) {
        console.error("❌ Erreur : Certains éléments HTML sont manquants.");
        return;
    }

    /**
     * 📌 Fonction pour charger un dataset et l'afficher dynamiquement
     */
    function loadDataset(datasetId) {
        if (!datasetId) {
            console.warn("❌ Avertissement : Aucun dataset sélectionné.");
            return;
        }

        console.log(`📌 Chargement du dataset ID : ${datasetId}`);

        fetch(`/data_cleaning/load_dataset/${datasetId}/`, {
            method: "GET",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("❌ Erreur serveur :", data.error);
                alert(data.error);
                return;
            }

            console.log("✅ Dataset chargé :", data);

            datasetHeaders.innerHTML = "<th>#</th>"; 
            data.columns.forEach(col => {
                const th = document.createElement("th");
                th.innerHTML = `
                    ${col}
                    <button class="btn btn-sm btn-light filter-btn" data-column="${col}" title="Filtrer">
                        <i class="bi bi-filter"></i> Filtrer
                    </button>
                `;
                datasetHeaders.appendChild(th);
            });

            datasetRows.innerHTML = "";
            data.rows.forEach((row, index) => {
                const tr = document.createElement("tr");

                const tdIndex = document.createElement("td");
                tdIndex.textContent = index + 1;
                tr.appendChild(tdIndex);

                data.columns.forEach(col => {
                    const td = document.createElement("td");
                    td.textContent = row[col] || "N/A";
                    tr.appendChild(td);
                });

                datasetRows.appendChild(tr);
            });

            console.log("✅ Affichage mis à jour.");
        })
        .catch(error => {
            console.error("❌ Erreur lors du chargement des données :", error);
            alert("Erreur réseau, veuillez réessayer.");
        });
    }

    datasetSelector.addEventListener("change", function () {
        console.log(`📌 Dataset sélectionné : ${this.value}`);
        loadDataset(this.value);
    });

    /**
     * 📌 Fonction pour ouvrir la modale et afficher dynamiquement les options de filtrage
     */
    function openFilterModal(columnName) {
        console.log(`📌 Ouverture de la modale de filtrage pour la colonne : ${columnName}`);

        const datasetId = datasetSelector.value;
        if (!datasetId) {
            alert("❌ Veuillez sélectionner un dataset !");
            return;
        }

        fetch(`/data_cleaning/get_column_type/${datasetId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ column_name: columnName }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("📌 Données reçues :", data);

            if (data.error) {
                console.error("❌ Erreur serveur :", data.error);
                return;
            }

            document.getElementById("filter-column-name").textContent = columnName;
            document.getElementById("filter-column-type").textContent = data.column_type;
            document.getElementById("filter-null-count").textContent = data.null_count;

            // 🔹 Afficher dynamiquement les champs de filtrage selon le type
            document.getElementById("numeric-filter-options").style.display = data.column_type === "numérique" ? "block" : "none";
            document.getElementById("text-filter-options").style.display = data.column_type === "texte" ? "block" : "none";
            document.getElementById("date-filter-options").style.display = data.column_type === "date" ? "block" : "none";

            let filterModal = new bootstrap.Modal(document.getElementById("filterModal"));
            filterModal.show();
        })
        .catch(error => console.error("❌ Erreur lors du chargement des données :", error));
    }

    document.addEventListener("click", function (event) {
        const filterBtn = event.target.closest(".filter-btn");
        if (filterBtn) {
            const columnName = filterBtn.dataset.column;
            openFilterModal(columnName);
        }
    });

    /**
     * 📌 Fonction pour récupérer et afficher les valeurs filtrées
     */
    document.addEventListener("click", function (event) {
        const showFilteredValuesButton = event.target.closest("#show-filtered-values");
        if (!showFilteredValuesButton) return;
    
        console.log("📌 [Filtrage] Bouton 'Afficher les valeurs filtrées' cliqué.");
    
        const datasetSelector = document.querySelector("#dataset-selector");
        const datasetId = datasetSelector ? datasetSelector.value : null;
    
        if (!datasetId) {
            alert("❌ Veuillez sélectionner un dataset !");
            return;
        }
    
        console.log("📌 datasetId utilisé pour le filtrage :", datasetId);
    
        const columnName = document.getElementById("filter-column-name")?.textContent.trim();
        const columnType = document.getElementById("filter-column-type")?.textContent.trim();
        let filterCondition = "";
        let filterValue = "";
    
        if (columnType === "numérique") {
            filterCondition = document.getElementById("numeric-filter-type")?.value;
            filterValue = document.getElementById("numeric-filter-value")?.value.trim();
        } else if (columnType === "texte") {
            filterValue = document.getElementById("text-filter-value")?.value.trim();
        } else if (columnType === "date") {
            filterCondition = document.getElementById("date-filter-type")?.value;
            filterValue = document.getElementById("date-filter-value")?.value;
        }
    
        if (!columnName || (!filterValue)) {
            alert("❌ Veuillez renseigner une valeur de filtrage.");
            return;
        }
        
    
        console.log(`📌 Envoi de la requête de filtrage...`);
    
        fetch(`/data_cleaning/get_filtered_values/${datasetId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ column: columnName, type: columnType, filter: filterCondition, value: filterValue }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("📌 Réponse du backend :", data);
    
            if (data.error) {
                alert(`❌ Erreur : ${data.error}`);
                console.error("❌ Erreur serveur :", data.error);
                return;
            }
    
            // 🔹 Mettre à jour la table avec les nouvelles valeurs filtrées
            updateDatasetTable(data.filtered_rows);
        })
        .catch(error => console.error("❌ Erreur lors du filtrage :", error));
    });
    

    console.log("✅ [data_cleaning.js] Script chargé et prêt.");
});


/**
 * 📌 Met à jour l'affichage du dataset avec les valeurs filtrées.
 * @param {Array} filteredRows - Données filtrées reçues du backend
 */
function updateDatasetTable(filteredRows) {
    console.log("📌 Mise à jour de la table avec les données filtrées.");

    const datasetRows = document.querySelector("#dataset-rows");
    if (!datasetRows) {
        console.error("❌ Erreur : Élément #dataset-rows introuvable !");
        return;
    }

    datasetRows.innerHTML = ""; // 🔹 Effacer l'ancienne table

    if (filteredRows.length === 0) {
        datasetRows.innerHTML = "<tr><td colspan='100%' class='text-muted'>Aucune donnée après filtrage.</td></tr>";
        return;
    }

    // 🔹 Ajouter chaque ligne filtrée
    filteredRows.forEach((row, index) => {
        const tr = document.createElement("tr");

        // Ajouter l'index
        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;
        tr.appendChild(tdIndex);

        // Ajouter les colonnes du dataset
        Object.values(row).forEach(value => {
            const td = document.createElement("td");
            td.textContent = value !== null ? value : "N/A";
            tr.appendChild(td);
        });

        datasetRows.appendChild(tr);
    });

    console.log("✅ Affichage du dataset mis à jour !");
}

/*
document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 data_cleaning.js chargé !");
    
    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetHeaders = document.querySelector("#dataset-headers");
    const datasetRows = document.querySelector("#dataset-rows");

    if (!datasetSelector || !datasetHeaders || !datasetRows) {
        console.error("❌ Erreur : Des éléments nécessaires pour l'affichage du dataset sont introuvables.");
        return;
    }

    // 📌 Événement pour changer le dataset
    datasetSelector.addEventListener("change", function () {
        const datasetId = this.value;
        if (!datasetId) return;

        console.log(`📌 Chargement du dataset ID : ${datasetId}`);

        fetch(`/data_cleaning/load_dataset/${datasetId}/`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                console.log("📌 Dataset chargé :", data);

                // 📌 Mise à jour des colonnes (ajoute un index visuel, mais pas dans les données)
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

                // 📌 Mise à jour des lignes (affiche un index visuel, mais n'affecte pas les données)
                datasetRows.innerHTML = "";
                data.rows.forEach((row, index) => {
                    const tr = document.createElement("tr");

                    // 📌 Ajoute un index visuel pour l'affichage uniquement
                    const tdIndex = document.createElement("td");
                    tdIndex.textContent = index + 1;
                    tr.appendChild(tdIndex);

                    data.columns.forEach(col => {
                        const td = document.createElement("td");
                        td.textContent = row[col] || "N/A";
                        tr.appendChild(td);
                    });

                    datasetRows.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("❌ Erreur lors du chargement des données :", error);
                alert("Erreur réseau, veuillez réessayer.");
            });
    });

    // 📌 Gestion des clics sur les boutons de filtrage
    document.addEventListener("click", function (event) {
        const filterBtn = event.target.closest(".filter-btn");
        if (filterBtn) {
            const columnName = filterBtn.dataset.column;

            // ✅ Vérifie que l'utilisateur ne tente pas de filtrer la colonne d'index
            if (columnName === "#") {
                alert("❌ Impossible de filtrer par numéro de ligne !");
                return;
            }

            openFilterModal(columnName);
        }
    });

    // 📌 Fonction pour ouvrir la modale de filtrage
    function openFilterModal(columnName) {
        console.log("📌 Ouverture de la modale pour la colonne :", columnName);

        const datasetId = datasetSelector.value;
        if (!datasetId) {
            alert("Veuillez sélectionner un dataset !");
            return;
        }

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
                    console.error("❌ Erreur serveur :", data.error);
                    return;
                }

                document.getElementById("filter-column-name").textContent = columnName;
                document.getElementById("filter-column-type").textContent = data.column_type;
                document.getElementById("filter-null-count").textContent = data.null_count;

                document.getElementById("numeric-filter-options").style.display = data.column_type === "numérique" ? "block" : "none";
                document.getElementById("text-filter-options").style.display = data.column_type === "texte" ? "block" : "none";
                document.getElementById("date-filter-options").style.display = data.column_type === "date" ? "block" : "none";

                let filterModal = new bootstrap.Modal(document.getElementById("filterModal"));
                filterModal.show();
            })
            .catch(error => console.error("❌ Erreur lors du chargement des informations :", error));
    }

    // 📌 Gestion de l'affichage des valeurs filtrées
    document.getElementById("show-filtered-values").addEventListener("click", function () {
        console.log("📌 Bouton 'Afficher les valeurs filtrées' cliqué.");

        const datasetId = datasetSelector.value;
        const columnName = document.getElementById("filter-column-name").textContent;
        const filterType = document.getElementById("filter-column-type").textContent.toLowerCase();
        let filterValue = null;
        let filterCondition = null;

        if (!datasetId) {
            alert("Veuillez sélectionner un dataset !");
            return;
        }

        // ✅ Empêche d'envoyer le numéro de ligne au backend
        if (columnName === "#" || columnName === "index") {
            alert("❌ Impossible de filtrer par numéro de ligne !");
            return;
        }

        if (filterType === "numérique") {
            filterCondition = document.getElementById("numeric-filter-type").value;
            filterValue = document.getElementById("numeric-filter-value").value;
        } else if (filterType === "texte") {
            filterValue = document.getElementById("text-filter-value").value;
            filterCondition = "contains";
        } else if (filterType === "date") {
            filterCondition = document.getElementById("date-filter-type").value;
            filterValue = document.getElementById("date-filter-value").value;
        }

        if (!filterValue) {
            alert("Veuillez entrer une valeur pour filtrer !");
            return;
        }

        console.log(`📌 Envoi du filtre : ${columnName} ${filterCondition} ${filterValue}`);
        console.log("📌 Données envoyées au backend :", {
            column: columnName,
            type: filterType,
            filter: filterCondition,
            value: filterValue
        });

        fetch(`/data_cleaning/get_filtered_values/${datasetId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({
                column: columnName,
                type: filterType,
                filter: filterCondition,
                value: filterValue
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                console.log("📌 Résultats filtrés reçus :", data.filtered_rows);
                updateDatasetVisualization(data.filtered_rows);
            })
            .catch(error => console.error("❌ Erreur lors de la récupération des valeurs filtrées :", error));
    });
});

/**
 * Met à jour l'affichage du dataset avec les données filtrées.
 * @param {Array} filteredRows - Les nouvelles lignes filtrées à afficher.
 */
/*
function updateDatasetVisualization(filteredRows) {
    console.log("📌 Mise à jour de l'affichage avec les données filtrées :", filteredRows);

    const datasetRows = document.querySelector("#dataset-rows");
    if (!datasetRows) {
        console.error("❌ Erreur : L'élément #dataset-rows est introuvable.");
        return;
    }

    datasetRows.innerHTML = ""; // Efface les anciennes données

    // Génère et ajoute les nouvelles lignes filtrées
    filteredRows.forEach((row, index) => {
        const tr = document.createElement("tr");

        // Numéro de ligne affiché uniquement (mais non envoyé au backend)
        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;
        tr.appendChild(tdIndex);

        Object.values(row).forEach(value => {
            const td = document.createElement("td");
            td.textContent = value || "N/A";
            tr.appendChild(td);
        });

        datasetRows.appendChild(tr);
    });

    console.log("✅ Affichage mis à jour avec succès !");
}
*/