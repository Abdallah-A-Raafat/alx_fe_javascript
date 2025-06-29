// Array to store quotes with text and category
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "motivation" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "inspiration" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "inspiration" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "motivation" },
    { text: "The only impossible journey is the one you never begin.", category: "motivation" },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", category: "life" },
    { text: "Be yourself; everyone else is already taken.", category: "inspiration" }
];

// Function to display a random quote based on selected category
function showRandomQuote() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    let filteredQuotes = quotes;
    
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
    // Populate initial categories
    populateCategories();
    
    // Add event listeners
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('addQuoteBtn').addEventListener('click', createAddQuoteForm);
    document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
    
    // Display initial quote
    showRandomQuote();
});

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
