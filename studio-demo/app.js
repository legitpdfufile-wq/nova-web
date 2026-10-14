document.addEventListener('DOMContentLoaded', () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dogId = btn.getAttribute('data-dog-id');
            const index = favorites.indexOf(dogId);
            if (index !== -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(dogId);
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
            btn.textContent = favorites.includes(dogId) ? 'Saved — remove' : 'Favorite';
            btn.setAttribute('aria-pressed', favorites.includes(dogId));
        });
    });

    document.querySelector('.windows-launcher').addEventListener('click', () => {
        const batchText = "@echo off\r\nstart \"\" \"%~dp0index.html\"\r\n";
        const blob = new Blob([batchText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'START_PRODUCT.bat';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        document.querySelector('.windows-launcher-message').textContent = 'Download Windows Launcher';
    });

    document.querySelector('.filter-breed').addEventListener('change', () => {
    const breed = document.querySelector('.filter-breed').value;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (breed === 'All' || card.getAttribute('data-breed') === breed) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// Initialize FAQ toggles
const faqToggles = document.querySelectorAll('.faq-toggle');
faqToggles.forEach(toggle => {
    const answer = toggle.nextElementSibling;
    answer.style.display = 'none';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
        toggle.setAttribute('aria-expanded', answer.style.display === 'none' ? 'false' : 'true');
    });
    toggle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle.click();
        }
    });
});

document.querySelector('.filter-apply').addEventListener('click', () => {
        const breed = document.querySelector('.filter-breed').value;
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (breed === 'All' || card.getAttribute('data-breed') === breed) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    document.querySelector('.filter-apply').addEventListener('click', () => {
        document.querySelector('.filter-breed').dispatchEvent(new Event('change'));
    });

    document.querySelector('.submit').addEventListener('click', (event) => {
        event.preventDefault();
        const name = document.querySelector('#name').value;
        const email = document.querySelector('#email').value;
        if (!name || !email || !document.querySelector('#name').checkValidity() || !document.querySelector('#email').checkValidity()) {
            document.querySelector('.error-message').textContent = 'Name and email are required.';
        } else {
            document.querySelector('.error-message').textContent = '';
            const application = {
                name,
                email
            };
            const applicationFile = JSON.stringify(application, null, 2);
            const blob = new Blob([applicationFile], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'application.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            document.querySelector('.application-status').textContent = 'Application downloaded';
        }
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
    const dogId = btn.getAttribute('data-dog-id');
    const isFavorite = favorites.includes(dogId);
    btn.textContent = isFavorite ? 'Saved — remove' : 'Favorite';
    btn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
});
});
