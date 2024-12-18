document.addEventListener("DOMContentLoaded", function () {
    const datasetItems = document.querySelectorAll(".dataset-item");
    const datasetContent = document.getElementById("dataset-content");

    // Gérer le clic pour afficher le contenu du dataset sélectionné
    datasetItems.forEach(item => {
        item.addEventListener("click", async () => {
            const datasetId = item.getAttribute("data-id");

            try {
                const response = await fetch(`/data_cleaning/dataset/${datasetId}/`);
                if (response.ok) {
                    const data = await response.json();

                    // Remplir le contenu principal avec les détails du dataset
                    datasetContent.innerHTML = `
                        <h4 class="text-center">${data.name}</h4>
                        <p><strong>Nombre de colonnes :</strong> ${data.columns.length}</p>
                        <p><strong>Date d'import :</strong> ${data.uploaded_at}</p>
                        <p><strong>Colonnes :</strong> ${data.columns.join(", ")}</p>
                    `;
                } else {
                    datasetContent.innerHTML = `<p class="text-danger">Impossible de charger le dataset.</p>`;
                }
            } catch (error) {
                console.error("Erreur lors de la récupération du dataset :", error);
                datasetContent.innerHTML = `<p class="text-danger">Erreur réseau, veuillez réessayer.</p>`;
            }
        });
    });
});
