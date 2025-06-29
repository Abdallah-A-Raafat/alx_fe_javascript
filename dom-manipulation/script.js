// Array to store quotes with text and category
let quotes = [];

// Initialize quotes with default data if no local storage exists
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "motivation" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "inspiration" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "inspiration" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "motivation" },
    { text: "The only impossible journey is the one you never begin.", category: "motivation" },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", category: "life" },
    { text: "Be yourself; everyone else is already taken.", category: "inspiration" }
];

// Local Storage Functions
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    } else {
        quotes = [...defaultQuotes];
        saveQuotes(); // Save default quotes to localStorage
    }
}

// Session Storage Functions
function saveLastViewedQuote(quote) {
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

function getLastViewedQuote() {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    return lastQuote ? JSON.parse(lastQuote) : null;
}

function saveUserPreferences(category) {
    sessionStorage.setItem('selectedCategory', category);
}

function getUserPreferences() {
    return sessionStorage.getItem('selectedCategory') || 'all';
}

// Function to display a random quote based on selected category
function showRandomQuote() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    let filteredQuotes = quotes;
    
    // Save user preference to session storage
    saveUserPreferences(categoryFilter);
    
    // Filter quotes by category if not "all"
    if (categoryFilter !== 'all') {
        filteredQuotes = quotes.filter(quote => quote.category === categoryFilter);
    }
    
    // If no quotes in selected category, show message
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteText').textContent = 'No quotes available in this category.';
        document.getElementById('quoteCategory').textContent = '';
        return;
    }
    
    // Select random quote from filtered quotes
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const selectedQuote = filteredQuotes[randomIndex];
    
    // Display the quote
    document.getElementById('quoteText').textContent = `"${selectedQuote.text}"`;
    document.getElementById('quoteCategory').textContent = `Category: ${selectedQuote.category}`;
    
    // Save last viewed quote to session storage
    saveLastViewedQuote(selectedQuote);
}

// Function to create and display the add quote form
function createAddQuoteForm() {
    const formContainer = document.getElementById('addQuoteForm');
    
    // Check if form already exists
    if (formContainer.style.display === 'block') {
        formContainer.style.display = 'none';
        return;
    }
    
    // Create form HTML
    formContainer.innerHTML = `
        <h3>Add New Quote</h3>
        <div class="form-group">
            <label for="newQuoteText">Quote Text:</label>
            <textarea id="newQuoteText" placeholder="Enter your quote here..." required></textarea>
        </div>
        <div class="form-group">
            <label for="newQuoteCategory">Category:</label>
            <input type="text" id="newQuoteCategory" placeholder="Enter category (e.g., motivation, life, inspiration)" required>
        </div>
        <div class="controls">
            <button type="button" onclick="addQuote()">Add Quote</button>
            <button type="button" onclick="cancelAddQuote()">Cancel</button>
        </div>
    `;
    
    // Show the form
    formContainer.style.display = 'block';
}

// Function to add a new quote to the array
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
    
    // Validate input
    if (!quoteText || !quoteCategory) {
        alert('Please fill in both the quote text and category.');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: quoteText,
        category: quoteCategory
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Save to local storage
    saveQuotes();
    
    // Update category dropdown
    populateCategories();
    
    // Clear form and hide it
    document.getElementById('addQuoteForm').style.display = 'none';
    
    // Show success message
    alert('Quote successfully added!');
    
    // Optionally display the new quote
    document.getElementById('categoryFilter').value = quoteCategory;
    showRandomQuote();
}

// Function to cancel adding a quote
function cancelAddQuote() {
    document.getElementById('addQuoteForm').style.display = 'none';
}

// Function to populate categories in the dropdown
function populateCategories() {
    const categorySelect = document.getElementById('categoryFilter');
    const currentValue = categorySelect.value;
    
    // Get unique categories from quotes
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Clear existing options except "All Categories"
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (categories.includes(currentValue)) {
        categorySelect.value = currentValue;
    }
}

// Function to handle category filter change
function filterQuotes() {
    showRandomQuote();
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load quotes from local storage
    loadQuotes();
    
    // Populate initial categories
    populateCategories();
    
    // Restore user preferences from session storage
    const savedCategory = getUserPreferences();
    document.getElementById('categoryFilter').value = savedCategory;
    
    // Add event listeners
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('addQuoteBtn').addEventListener('click', createAddQuoteForm);
    document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
    
    // Add import/export event listeners
    document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    
    // Display initial quote or last viewed quote
    const lastViewedQuote = getLastViewedQuote();
    if (lastViewedQuote && savedCategory !== 'all') {
        document.getElementById('quoteText').textContent = `"${lastViewedQuote.text}"`;
        document.getElementById('quoteCategory').textContent = `Category: ${lastViewedQuote.category}`;
    } else {
        showRandomQuote();
    }
});

// JSON Import and Export Functions

// Function to export quotes to JSON file
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'quotes.json';
    link.click();
    
    // Clean up the URL object
    URL.revokeObjectURL(link.href);
    
    alert('Quotes exported successfully!');
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            
            // Validate imported data
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid file format: Expected an array of quotes');
            }
            
            // Validate each quote object
            for (let quote of importedQuotes) {
                if (!quote.text || !quote.category) {
                    throw new Error('Invalid quote format: Each quote must have text and category');
                }
            }
            
            // Ask user if they want to replace or merge
            const replace = confirm('Do you want to replace existing quotes? Click Cancel to merge with existing quotes.');
            
            if (replace) {
                quotes = [...importedQuotes];
            } else {
                quotes.push(...importedQuotes);
            }
            
            // Save to local storage
            saveQuotes();
            
            // Update UI
            populateCategories();
            showRandomQuote();
            
            alert(`${importedQuotes.length} quotes imported successfully!`);
            
        } catch (error) {
            alert('Error importing quotes: ' + error.message);
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    fileReader.readAsText(file);
}

// Function to clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all quotes? This action cannot be undone.')) {
        quotes = [];
        localStorage.removeItem('quotes');
        sessionStorage.clear();
        
        // Reset to default quotes
        quotes = [...defaultQuotes];
        saveQuotes();
        
        // Update UI
        populateCategories();
        document.getElementById('categoryFilter').value = 'all';
        showRandomQuote();
        
        alert('All data cleared and reset to default quotes!');
    }
}

// Additional utility functions

// Function to export quotes (for potential future use)
function exportQuotes() {
    return JSON.stringify(quotes, null, 2);
}

// Function to import quotes (for potential future use)
function importQuotes(quotesJSON) {
    try {
        const importedQuotes = JSON.parse(quotesJSON);
        if (Array.isArray(importedQuotes)) {
            quotes = importedQuotes;
            saveQuotes();
            populateCategories();
            showRandomQuote();
            return true;
        }
    } catch (e) {
        console.error('Invalid quotes format');
        return false;
    }
}

// Function to get quote statistics
function getQuoteStats() {
    const stats = {};
    quotes.forEach(quote => {
        stats[quote.category] = (stats[quote.category] || 0) + 1;
    });
    return stats;
}

// Function to backup quotes to session storage (for emergency recovery)
function createBackup() {
    sessionStorage.setItem('quotesBackup', JSON.stringify(quotes));
}

// Function to restore from backup
function restoreFromBackup() {
    const backup = sessionStorage.getItem('quotesBackup');
    if (backup) {
        quotes = JSON.parse(backup);
        saveQuotes();
        populateCategories();
        showRandomQuote();
        return true;
    }
    return false;
}
