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

/**
 * 📌 Met à jour l'affichage du dataset avec les nouvelles données.
 * @param {Array} updatedRows - Les données mises à jour après une modification.
 */
function updateDatasetTable(updatedRows) {
    console.log("📌 Mise à jour de la table avec les nouvelles données.");

    const datasetRows = document.querySelector("#dataset-rows");
    if (!datasetRows) {
        console.error("❌ Erreur : Élément #dataset-rows introuvable !");
        return;
    }

    datasetRows.innerHTML = ""; // 🔹 Effacer l'ancienne table

    if (updatedRows.length === 0) {
        datasetRows.innerHTML = "<tr><td colspan='100%' class='text-muted'>Aucune donnée disponible après mise à jour.</td></tr>";
        return;
    }

    // 🔹 Ajouter chaque ligne mise à jour
    updatedRows.forEach((row, index) => {
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

    console.log("✅ Mise à jour du dataset affiché !");
}

/**
 * 📌 Ajoute une action à la section "Actions Entreprises"
 * @param {string} actionType - Type d'action effectuée (Filtrage, Remplacement, Suppression)
 * @param {string} columnName - Nom de la colonne concernée
 * @param {string} condition - Condition de filtrage appliquée (si applicable)
 * @param {string} oldValue - Ancienne valeur remplacée (si applicable)
 * @param {string} newValue - Nouvelle valeur (si applicable)
 */
function addActionToHistory(actionType, columnName, condition = "", oldValue = "", newValue = "") {
    console.log(`📌 Ajout d'une action entreprise : ${actionType} sur ${columnName}`);

    const actionLog = document.getElementById("action-log");
    if (!actionLog) {
        console.error("❌ Erreur : Conteneur d'historique des actions introuvable !");
        return;
    }

    // 🔹 Suppression du message "Aucune action entreprise..."
    if (actionLog.children.length === 1 && actionLog.children[0].classList.contains("text-muted")) {
        actionLog.innerHTML = "";
    }

    // 🔹 Création d'un identifiant unique pour chaque action
    const actionId = `action-${Date.now()}`;
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
    li.id = actionId;

    // 🔹 Contenu de l'action
    let actionText = `<strong>${actionType}</strong> - Colonne : <strong>${columnName}</strong>`;
    if (condition) {
        actionText += ` | Condition : <strong>${condition}</strong>`;
    }
    if (oldValue && newValue) {
        actionText += ` | <span class="text-muted">Remplacé</span> : <strong>${oldValue}</strong> ➝ <strong>${newValue}</strong>`;
    }

    // 🔹 Ajout du bouton "Annuler"
    li.innerHTML = `
        <div>${actionText}</div>
        <button class="btn btn-sm btn-danger undo-action" data-action-id="${actionId}">
            Annuler
        </button>
    `;

    // 🔹 Ajout de l'événement de suppression (annulation)
    li.querySelector(".undo-action").addEventListener("click", function () {
        console.log(`📌 Annulation de l'action : ${actionType} sur ${columnName}`);
        undoLastAction(actionId);
    });

    // 🔹 Ajout de l'élément dans la liste
    actionLog.appendChild(li);
}

/**
 * 📌 Annule une action entreprise
 * @param {Event} event - Événement de clic sur le bouton "Annuler"
 */
function undoLastAction(actionElement) {
    console.log("📌 Tentative d'annulation...");

    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        console.error("❌ Erreur : Aucun dataset sélectionné !");
        return;
    }

    console.log("📌 Élément action trouvé :", actionElement);

    fetch(`/data_cleaning/undo_last_action/${datasetId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("❌ Erreur : ", data.error);
            alert(`❌ Erreur : ${data.error}`);
            return;
        }

        console.log("📌 Annulation réussie, mise à jour de la vue.");
        loadDataset(datasetId);  // Recharge le dataset
        actionElement.remove();   // Supprime l'élément de l'historique des actions
    })
    .catch(error => console.error("❌ Erreur lors de l'annulation :", error));
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
            addActionToHistory("Filtrage", columnName, `${filterCondition} ${filterValue}`);

        })
        .catch(error => console.error("❌ Erreur lors du filtrage :", error));
    });
    

    console.log("✅ [data_cleaning.js] Script chargé et prêt.");
});




document.getElementById("replace-values-btn").addEventListener("click", function () {
    console.log("📌 Bouton 'Remplacer les valeurs filtrées' cliqué.");

    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("❌ Veuillez sélectionner un dataset !");
        return;
    }

    const columnName = document.getElementById("filter-column-name")?.textContent.trim();
    if (!columnName) {
        alert("❌ Colonne non trouvée.");
        return;
    }

    let filterCondition = "";
    let filterValue = "";

    // 🔹 Récupérer la condition et la valeur selon le type de colonne
    const columnType = document.getElementById("filter-column-type")?.textContent.trim();
    if (columnType === "numérique") {
        filterCondition = document.getElementById("numeric-filter-type")?.value;
        filterValue = document.getElementById("numeric-filter-value")?.value.trim();
    } else if (columnType === "texte") {
        filterValue = document.getElementById("text-filter-value")?.value.trim();
    } else if (columnType === "date") {
        filterCondition = document.getElementById("date-filter-type")?.value;
        filterValue = document.getElementById("date-filter-value")?.value;
    }

    if (!filterCondition && columnType !== "texte") {
        alert("❌ Veuillez sélectionner une condition de filtrage.");
        return;
    }
    if (!filterValue) {
        alert("❌ Veuillez saisir une valeur à filtrer.");
        return;
    }

    let newValue = prompt(`Entrez la nouvelle valeur pour remplacer '${filterValue}' dans la colonne '${columnName}' :`);
    if (newValue === null || newValue.trim() === "") {
        alert("❌ La nouvelle valeur ne peut pas être vide !");
        return;
    }

    console.log(`📌 Envoi de la requête de remplacement pour la colonne '${columnName}', condition '${filterCondition}', valeur '${filterValue}' → '${newValue}'`);

    fetch(`/data_cleaning/replace_filtered_values/${datasetId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            column: columnName,
            condition: filterCondition,
            old_value: filterValue,
            new_value: newValue
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 Réponse du backend :", data);
    
        if (data.error) {
            alert(`❌ Erreur : ${data.error}`);
            console.error("❌ Erreur serveur :", data.error);
            return;
        }
    
        // 🔹 Mettre à jour la table avec les nouvelles valeurs remplacées
        updateDatasetTable(data.updated_rows);
        addActionToHistory("Remplacement", columnName, filterCondition, filterValue, newValue);
    
        // 🔹 Afficher un message de succès
        alert(`✅ Valeur(s) correspondant à '${filterValue}' sous '${filterCondition}' remplacée(s) par '${newValue}' avec succès !`);
    })
    .catch(error => console.error("❌ Erreur lors du remplacement :", error));
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 data_cleaning.js chargé !");

    // 📌 Vérifie si le bouton "Supprimer les valeurs filtrées" est détecté
    const deleteFilteredValuesButton = document.getElementById("delete-filtered-values-btn");
    if (!deleteFilteredValuesButton) {
        console.error("❌ Erreur : Bouton 'Supprimer les valeurs filtrées' introuvable !");
    } else {
        console.log("✅ Bouton 'Supprimer les valeurs filtrées' détecté.");
    }

    /**
     * 📌 Fonction pour supprimer les lignes filtrées
     */
    deleteFilteredValuesButton.addEventListener("click", function () {
        console.log("📌 [Suppression] Bouton 'Supprimer les valeurs filtrées' cliqué.");

        const datasetSelector = document.querySelector("#dataset-selector");
        const datasetId = datasetSelector ? datasetSelector.value : null;

        if (!datasetId) {
            alert("❌ Veuillez sélectionner un dataset !");
            return;
        }

        console.log("📌 datasetId utilisé pour la suppression :", datasetId);

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

        if (!columnName || (!filterCondition && columnType !== "texte") || !filterValue) {
            alert("❌ Veuillez renseigner tous les champs de filtrage.");
            return;
        }

        console.log(`📌 Envoi de la requête de suppression...`);

        fetch(`/data_cleaning/delete_filtered_rows/${datasetId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ column: columnName, condition: filterCondition, value: filterValue }),
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
            updateDatasetTable(data.updated_rows);
            addActionToHistory("Suppression de valeurs", columnName, `${filterCondition} ${filterValue}`);

        })
        .catch(error => console.error("❌ Erreur lors de la suppression :", error));
    });

    console.log("✅ [data_cleaning.js] Script chargé et prêt.");
});

document.addEventListener("click", function (event) {
    const deleteColumnButton = event.target.closest("#delete-column-btn");
    if (!deleteColumnButton) return;

    console.log("📌 Bouton 'Supprimer la colonne' cliqué.");

    const datasetSelector = document.querySelector("#dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;
    const columnName = document.getElementById("filter-column-name")?.textContent.trim();

    if (!datasetId || !columnName) {
        alert("❌ Veuillez sélectionner un dataset et une colonne !");
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir masquer temporairement la colonne '${columnName}' ?`)) {
        return;
    }

    console.log(`📌 Masquage temporaire de la colonne '${columnName}'...`);

    fetch(`/data_cleaning/delete_column/${datasetId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ column: columnName }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 Réponse du backend :", data);

        if (data.error) {
            alert(`❌ Erreur : ${data.error}`);
            console.error("❌ Erreur serveur :", data.error);
            return;
        }

        // 🔹 Supprimer dynamiquement la colonne de l'affichage
        removeColumnFromTable(columnName);
        addActionToHistory("Suppression de colonne", columnName);

    })
    .catch(error => console.error("❌ Erreur lors de la suppression :", error));
});

/**
 * 📌 Supprime une colonne de la table (à la fois le titre et les valeurs)
 * @param {string} columnName - Le nom de la colonne à supprimer
 */
function removeColumnFromTable(columnName) {
    console.log(`📌 Suppression dynamique de la colonne '${columnName}'`);

    const datasetHeaders = document.querySelector("#dataset-headers");
    const datasetRows = document.querySelectorAll("#dataset-rows tr");

    // 🔹 Supprimer l'en-tête de la colonne
    const headerCells = datasetHeaders.querySelectorAll("th");
    let columnIndex = -1;

    headerCells.forEach((th, index) => {
        if (th.textContent.trim().includes(columnName)) {
            columnIndex = index;
            th.remove(); // 🔹 Supprime le titre
        }
    });

    if (columnIndex === -1) {
        console.warn("⚠️ Colonne non trouvée dans les en-têtes !");
        return;
    }

    // 🔹 Supprimer les valeurs de la colonne correspondante
    datasetRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells[columnIndex]) {
            cells[columnIndex].remove(); // 🔹 Supprime chaque cellule de la colonne
        }
    });

    console.log(`✅ Colonne '${columnName}' supprimée dynamiquement !`);
}


const actionHistoryContainer = document.querySelector("#action-history");
/**
 * 📌 Ajoute une action dans la section "Actions Entreprises"
 * @param {string} actionType - Type d'action (Filtrage, Remplacement, Suppression)
 * @param {string} columnName - Nom de la colonne concernée
 * @param {string} condition - Condition appliquée (si applicable)
 * @param {string} oldValue - Ancienne valeur (si applicable)
 * @param {string} newValue - Nouvelle valeur (si applicable)
 */
function addActionToLog(actionType, columnName, condition = "", oldValue = "", newValue = "") {
    console.log(`📌 Ajout de l'action : ${actionType} sur ${columnName}`);

    const actionLog = document.getElementById("action-log");
    if (!actionLog) {
        console.error("❌ Erreur : Conteneur des actions introuvable !");
        return;
    }

    // 🔹 Suppression du message "Aucune action entreprise..."
    if (actionLog.children.length === 1 && actionLog.children[0].classList.contains("text-muted")) {
        actionLog.innerHTML = "";
    }

    // 🔹 Création de l'élément d'action
    const actionId = `action-${Date.now()}`;
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
    li.id = actionId;

    // 🔹 Contenu de l'action
    let actionText = `<strong>${actionType}</strong> sur <strong>${columnName}</strong>`;
    if (condition) {
        actionText += ` | Condition : <strong>${condition}</strong>`;
    }
    if (oldValue && newValue) {
        actionText += ` | <span class="text-muted">Remplacé</span> : <strong>${oldValue}</strong> ➝ <strong>${newValue}</strong>`;
    }

    // 🔹 Bouton "Annuler l'action"
    li.innerHTML = `
        <span>${actionText}</span>
        <button class="btn btn-sm btn-danger undo-action" data-action-id="${actionId}" data-action-type="${actionType}" data-column="${columnName}">
            Annuler
        </button>
    `;

    // 🔹 Ajout de l'événement d'annulation
    li.querySelector(".undo-action").addEventListener("click", function () {
        console.log(`📌 Annulation de l'action : ${actionType} sur ${columnName}`);
        undoLastAction(li);
    });

    // 🔹 Ajout de l'action à la liste
    actionLog.appendChild(li);
}

// 📌 Ajout d'un écouteur global pour détecter les clics sur les boutons "Annuler"
document.addEventListener("click", function(event) {
    const undoButton = event.target.closest(".undo-action");
    if (undoButton) {
        console.log("📌 Bouton 'Annuler' cliqué !");
        undoLastAction(event);
    }
});