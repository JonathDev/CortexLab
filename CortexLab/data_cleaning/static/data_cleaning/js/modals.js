document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 modals.js chargé !");

    /**
     * 📌 Fonction pour ouvrir la modale des valeurs uniques
     * @param {string} columnName - Nom de la colonne
     */
    function openUniqueValuesModal(columnName) {
        console.log(`📌 [Unique Values] Ouverture de la modale des valeurs uniques pour : ${columnName}`);

        const datasetId = document.querySelector("#dataset-selector").value;
        if (!datasetId) {
            alert("❌ Veuillez sélectionner un dataset !");
            return;
        }

        console.log("📌 Récupération des valeurs uniques depuis le backend...");

        fetch(`/data_cleaning/get_unique_values/${datasetId}/`, {
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

            // 🔹 Mise à jour des informations dans la modale
            document.getElementById("unique-values-column-name").textContent = columnName;

            const tableBody = document.getElementById("unique-values-table-body");
            if (!tableBody) {
                console.error("❌ Erreur : Élément #unique-values-table-body introuvable !");
                return;
            }

            // 🔹 Nettoyage des anciennes valeurs avant d'insérer les nouvelles
            tableBody.innerHTML = "";

            if (data.unique_values && Object.keys(data.unique_values).length > 0) {
                console.log("✅ Ajout des valeurs uniques :", data.unique_values);

                Object.entries(data.unique_values).forEach(([value, percentage]) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${value}</td><td>${percentage.toFixed(2)}%</td>`;
                    tableBody.appendChild(row);
                });
            } else {
                console.warn("⚠️ Aucune valeur unique disponible.");
                tableBody.innerHTML = "<tr><td colspan='2' class='text-muted'>Aucune valeur unique disponible</td></tr>";
            }

            let uniqueValuesModal = new bootstrap.Modal(document.getElementById("uniqueValuesModal"));
            uniqueValuesModal.show();
        })
        .catch(error => console.error("❌ Erreur lors du chargement des valeurs uniques :", error));
    }

    // 📌 Gestion du clic sur "Voir toutes les valeurs uniques"
    document.addEventListener("click", function (event) {
        const btn = event.target.closest("#view-all-unique-values");
        if (btn) {
            const columnNameElem = document.getElementById("filter-column-name");
            if (!columnNameElem) {
                console.error("❌ Élément 'filter-column-name' introuvable !");
                return;
            }
            const columnName = columnNameElem.textContent.trim();
            console.log("📌 Bouton 'Voir toutes les valeurs uniques' cliqué pour :", columnName);
            openUniqueValuesModal(columnName);
        }
    });

    /**
     * 📌 Fonction pour récupérer le token CSRF
     */
    function getCSRFToken() {
        return document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1] || null;
    }

    console.log("✅ [modals.js] Script chargé et prêt.");
});

// 📌 Expose `openUniqueValuesModal` pour que d'autres fichiers puissent l'utiliser
window.openUniqueValuesModal = openUniqueValuesModal;

document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 modals.js chargé !");
    
    // 📌 Vérifie si le bouton "Afficher les valeurs filtrées" est bien détecté
    const showFilteredValuesButton = document.getElementById("show-filtered-values");
    if (!showFilteredValuesButton) {
        console.error("❌ Erreur : Bouton 'Afficher les valeurs filtrées' introuvable !");
    } else {
        console.log("✅ Bouton 'Afficher les valeurs filtrées' détecté.");
    }

    /**
     * 📌 Fonction pour récupérer et afficher les valeurs filtrées
     */
    function showFilteredValues() {
        console.log("📌 [Filtrage] Bouton 'Afficher les valeurs filtrées' cliqué.");

        // 📌 Récupération de l'ID du dataset
        const datasetId = document.querySelector("#dataset-selector")?.value;
        if (!datasetId) {
            alert("❌ Veuillez sélectionner un dataset !");
            return;
        }

        // 📌 Récupération du nom de la colonne à filtrer
        const columnNameElem = document.getElementById("filter-column-name");
        if (!columnNameElem) {
            console.error("❌ Élément 'filter-column-name' introuvable !");
            return;
        }
        const columnName = columnNameElem.textContent.trim();

        // 📌 Détection du type de colonne
        const columnType = document.getElementById("filter-column-type")?.textContent.trim();
        let filterCondition = "";
        let filterValue = "";

        // 🔹 Récupération des valeurs de filtrage en fonction du type de colonne
        if (columnType === "numérique") {
            filterCondition = document.getElementById("numeric-filter-type")?.value;
            filterValue = document.getElementById("numeric-filter-value")?.value.trim();
        } else if (columnType === "texte") {
            filterValue = document.getElementById("text-filter-value")?.value.trim();
        } else if (columnType === "date") {
            filterCondition = document.getElementById("date-filter-type")?.value;
            filterValue = document.getElementById("date-filter-value")?.value;
        }

        // 📌 Vérification des champs avant l'envoi
        if (!columnName || (!filterCondition && columnType !== "texte") || !filterValue) {
            alert("❌ Veuillez renseigner tous les champs de filtrage.");
            return;
        }

        console.log(`📌 [Filtrage] Envoi de la requête : Colonne='${columnName}', Type='${columnType}', Condition='${filterCondition}', Valeur='${filterValue}'`);

        // 📌 Envoi de la requête au backend pour filtrer les valeurs
        fetch(`/data_cleaning/get_filtered_values/${datasetId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                column: columnName,
                type: columnType,
                filter: filterCondition,
                value: filterValue
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("📌 Données filtrées reçues :", data);

            if (data.error) {
                alert(`❌ Erreur : ${data.error}`);
                console.error("❌ Erreur serveur :", data.error);
                return;
            }

            updateFilteredValuesDisplay(data.filtered_rows);
        })
        .catch(error => console.error("❌ Erreur lors de la récupération des valeurs filtrées :", error));
    }

    /**
     * 📌 Met à jour l'affichage des valeurs filtrées dans la modale
     */
    function updateFilteredValuesDisplay(filteredRows) {
        console.log("📌 Mise à jour de l'affichage des valeurs filtrées.");

        const filteredValuesContainer = document.getElementById("filtered-values-container");
        if (!filteredValuesContainer) {
            console.error("❌ Erreur : Élément #filtered-values-container introuvable !");
            return;
        }

        filteredValuesContainer.innerHTML = "";

        if (filteredRows.length === 0) {
            filteredValuesContainer.innerHTML = "<p class='text-muted'>Aucune valeur trouvée après filtrage.</p>";
            return;
        }

        // 🔹 Création d'une liste pour afficher les valeurs filtrées
        const list = document.createElement("ul");
        list.classList.add("list-group");

        filteredRows.forEach(row => {
            const listItem = document.createElement("li");
            listItem.textContent = JSON.stringify(row);
            listItem.classList.add("list-group-item");
            list.appendChild(listItem);
        });

        filteredValuesContainer.appendChild(list);
        console.log("✅ Affichage des valeurs filtrées mis à jour.");
    }

    // 📌 Attachement de l'événement "click" au bouton "Afficher les valeurs filtrées"
    if (showFilteredValuesButton) {
        showFilteredValuesButton.addEventListener("click", showFilteredValues);
        console.log("✅ Événement attaché au bouton 'Afficher les valeurs filtrées'.");
    } else {
        console.warn("⚠️ Avertissement : Le bouton 'Afficher les valeurs filtrées' n'existe pas encore au moment du chargement.");
    }

    console.log("✅ [modals.js] Script chargé et prêt.");
});

/**
 * 📌 Fonction pour récupérer le token CSRF
 */
function getCSRFToken() {
    return document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1] || null;
}



/*

document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 modals.js chargé !");

    const replaceButton = document.getElementById("replace-values-btn");
    const applyReplaceButton = document.getElementById("apply-replace-btn");
    let currentColumn = "";
    let currentValue = "";

    if (replaceButton) {
        replaceButton.addEventListener("click", function () {
            console.log("📌 Bouton 'Remplacer les valeurs filtrées' cliqué.");
            
            // Vérifier si les éléments existent avant de les utiliser
            const filterColumnElem = document.getElementById("filter-column-name");
            const numericValueElem = document.getElementById("numeric-filter-value");
            const textValueElem = document.getElementById("text-filter-value");
            const dateValueElem = document.getElementById("date-filter-value");

            if (!filterColumnElem) {
                console.error("❌ Erreur : 'filter-column-name' introuvable.");
                return;
            }

            currentColumn = filterColumnElem.textContent;
            currentValue = (numericValueElem?.value || textValueElem?.value || dateValueElem?.value || "").trim();

            if (!currentColumn || !currentValue) {
                alert("❌ Veuillez sélectionner une colonne et une valeur.");
                return;
            }

            // Vérifier si la modale et ses éléments existent avant de les manipuler
            const replaceColumnElem = document.getElementById("replace-column-name");
            const replaceOldValueElem = document.getElementById("replace-old-value");
            const replaceNewValueElem = document.getElementById("replace-new-value");

            if (!replaceColumnElem || !replaceOldValueElem || !replaceNewValueElem) {
                console.error("❌ Erreur : Éléments de la modale de remplacement introuvables.");
                return;
            }

            // Mise à jour de la modale
            replaceColumnElem.textContent = currentColumn;
            replaceOldValueElem.textContent = currentValue;
            replaceNewValueElem.value = "";

            // Affichage de la modale
            let replaceModal = new bootstrap.Modal(document.getElementById("replaceValuesModal"));
            replaceModal.show();
        });
    }

    if (applyReplaceButton) {
        applyReplaceButton.addEventListener("click", function () {
            console.log("📌 Bouton 'Appliquer remplacement' cliqué.");

            const datasetSelector = document.querySelector("#dataset-selector");
            const datasetId = datasetSelector ? datasetSelector.value : null;
            const newValue = document.getElementById("replace-new-value")?.value.trim();
            const condition = document.getElementById("numeric-filter-type")?.value || "=="; // Récupération de la condition

            if (!datasetId || !currentColumn || !currentValue || newValue === "") {
                alert("❌ Veuillez remplir tous les champs.");
                return;
            }

            console.log(`📌 Envoi de la requête : Remplacer '${currentValue}' par '${newValue}' dans '${currentColumn}' avec condition '${condition}'`);

            fetch(`/data_cleaning/replace_values/${datasetId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify({
                    column: currentColumn,
                    old_value: currentValue,
                    new_value: newValue,
                    condition: condition  // Ajout de la condition
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                console.log("✅ Valeurs remplacées avec succès :", data.message);

                // Recharger les données du dataset après remplacement
                if (datasetSelector) {
                    setTimeout(() => {
                        datasetSelector.dispatchEvent(new Event("change"));
                    }, 500);
                } else {
                    console.error("❌ Erreur : datasetSelector non trouvé.");
                }

                // Fermer la modale
                let replaceModal = bootstrap.Modal.getInstance(document.getElementById("replaceValuesModal"));
                replaceModal.hide();
            })
            .catch(error => console.error("❌ Erreur lors du remplacement :", error));
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 modals.js chargé !");
    
    const deleteFilteredButton = document.getElementById("delete-filtered-values-btn");

    if (deleteFilteredButton) {
        deleteFilteredButton.addEventListener("click", function () {
            console.log("📌 Bouton 'Supprimer les valeurs filtrées' cliqué.");

            const datasetSelector = document.querySelector("#dataset-selector");
            const datasetId = datasetSelector ? datasetSelector.value : null;
            const columnName = document.getElementById("filter-column-name").textContent;
            const filterType = document.getElementById("filter-column-type").textContent.toLowerCase();

            let filterCondition = "";
            let filterValue = "";

            // Sélectionner la condition et la valeur en fonction du type de colonne
            if (filterType === "numérique") {
                filterCondition = document.getElementById("numeric-filter-type").value;
                filterValue = document.getElementById("numeric-filter-value").value;
            } else if (filterType === "texte") {
                filterCondition = "contains"; // Suppression basée sur la présence du texte
                filterValue = document.getElementById("text-filter-value").value;
            } else if (filterType === "date") {
                filterCondition = document.getElementById("date-filter-type").value;
                filterValue = document.getElementById("date-filter-value").value;
            }

            if (!datasetId || !columnName || !filterValue) {
                alert("❌ Veuillez sélectionner un dataset et un filtre valide.");
                return;
            }

            console.log(`📌 Suppression des valeurs dans '${columnName}' où '${columnName} ${filterCondition} ${filterValue}'`);

            fetch(`/data_cleaning/delete_filtered_values/${datasetId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify({
                    column: columnName,
                    filter: filterCondition,
                    type: filterType,
                    value: filterValue
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                console.log("✅ Valeurs supprimées avec succès :", data.message);

                // Recharger les données du dataset après suppression
                if (datasetSelector) {
                    setTimeout(() => {
                        datasetSelector.dispatchEvent(new Event("change"));
                    }, 500);
                } else {
                    console.error("❌ Erreur : datasetSelector non trouvé.");
                }
            })
            .catch(error => console.error("❌ Erreur lors de la suppression :", error));
        });
    }
});
*/