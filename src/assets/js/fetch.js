import axios from 'axios';
import get from 'lodash/get';

// Configure axios with timeout and base URL
const api = axios.create( {
    baseURL: process.env.API_BASE_URL || 'https://openlibrary.org',
    timeout: parseInt( process.env.API_TIMEOUT ) || 15000,
} );

export async function fetchBook() {
    try {
        const searchName = document.getElementById( 'searchName' ).value.trim();

        if ( !searchName ) {
            throw new Error( 'Please enter a search term!' );
        }

        const MAX_RESULTS = parseInt( process.env.MAX_RESULTS ) || 50;

        // OpenLibrary uses underscores instead of spaces in subjects
        const formattedSearch = searchName.toLowerCase().replace( /\s+/g, '_' );

        // Use axios instead of fetch
        const response = await api.get( `/subjects/${formattedSearch}.json`, {
            params: {
                limit: MAX_RESULTS,
                offset: 0,
            },
        } );

        const data = response.data;
        console.log( data );

        // Check if there are results BEFORE showing loading
        if ( !data.works || data.works.length === 0 ) {
            throw new Error( 'No books found for this search.' );
        }

        console.log( `Max results requested: ${MAX_RESULTS}, Received: ${data.works.length}` );

        // Clear previous results and show loading
        const appDiv = document.getElementById( 'app' );
        appDiv.innerHTML = '';
        const loadingDiv = document.getElementById( 'loading' );
        loadingDiv.style.display = 'block';

        // Create and display all cards immediately images load progressively


        data.works.forEach( ( work ) => {
            const card = document.createElement( 'article' );
            card.className = 'book-card';
            card.setAttribute( 'role', 'article' );
            card.setAttribute( 'tabindex', '0' );
            card.setAttribute( 'aria-label', `${work.title} - Click for more details` );

            // Title
            const titleElement = document.createElement( 'h3' );
            titleElement.textContent = work.title;

            // Image
            const imgElement = document.createElement( 'img' );
            const coverId = get( work, 'cover_id' );
            const coverEditionKey = get( work, 'cover_edition_key' );
            imgElement.width = 180;
            imgElement.height = 270;
            imgElement.loading = 'lazy';
            if ( coverId ) {
                imgElement.src = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
            } else if ( coverEditionKey ) {
                imgElement.src = `https://covers.openlibrary.org/b/olid/${coverEditionKey}-M.jpg`;
            } else {
                imgElement.src = 'https://openlibrary.org/images/icons/avatar_book-sm.png';
            }
            imgElement.alt = get( work, 'title', 'Book' );
            imgElement.onerror = function () {
                this.src = 'https://openlibrary.org/images/icons/avatar_book-lg.png';
            };

            // Author
            const authorElement = document.createElement( 'p' );
            const authorName = get( work, 'authors[0].name', 'Unknown author' );
            authorElement.textContent = authorName;

            card.appendChild( titleElement );
            card.appendChild( imgElement );
            card.appendChild( authorElement );

            // Add click listener to show description
            card.addEventListener( 'click', () => showBookDescription( work ) );
            // Add keyboard support
            card.addEventListener( 'keypress', ( e ) => {
                if ( e.key === 'Enter' || e.key === ' ' ) {
                    e.preventDefault();
                    showBookDescription( work );
                }
            } );
            // Function to show book description in a modal
            async function showBookDescription( work ) {
                try {
                    // Create or retrieve the modal
                    let modal = document.getElementById( 'book-modal' );
                    if ( !modal ) {
                        modal = document.createElement( 'div' );
                        modal.id = 'book-modal';
                        modal.className = 'modal';
                        modal.setAttribute( 'role', 'dialog' );
                        modal.setAttribute( 'aria-modal', 'true' );
                        modal.setAttribute( 'aria-labelledby', 'modal-title' );
                        modal.innerHTML = `
                <div class="modal-content">
                    <button class="close" aria-label="Close dialog">&times;</button>
                    <div id="modal-body"></div>
                </div>
            `;
                        document.body.appendChild( modal );

                        const closeBtn = modal.querySelector( '.close' );
                        closeBtn.addEventListener( 'click', () => {
                            modal.style.display = 'none';
                            document.body.style.overflow = '';
                        } );
                        modal.addEventListener( 'click', ( e ) => {
                            if ( e.target === modal ) {
                                modal.style.display = 'none';
                                document.body.style.overflow = '';
                            }
                        } );
                        document.addEventListener( 'keydown', escModalHandler );
                    }

                    function escModalHandler( e ) {
                        const modal = document.getElementById( 'book-modal' );
                        if ( e.key === 'Escape' && modal && modal.style.display === 'block' ) {
                            modal.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                    }

                    const modalBody = document.getElementById( 'modal-body' );
                    modalBody.innerHTML = '<p class="modal-loading">⏳ Loading...</p>';
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    setTimeout( () => {
                        modal.querySelector( '.close' ).focus();
                    }, 100 );

                    // Use axios to retrieve book details
                    const bookKey = work.key; // e.g.: "/works/OL45804W"
                    const response = await api.get( `${bookKey}.json` );

                    const bookDetails = response.data;

                    // Use get for safe data access
                    const description = get( bookDetails, 'description.value' ) ||
                        get( bookDetails, 'description' ) ||
                        'Description not available';

                    // Authors with get
                    const authorsList = get( work, 'authors', [] );
                    const authors = authorsList.length > 0
                        ? authorsList.map( a => get( a, 'name', 'Unknown' ) ).join( ', ' )
                        : 'Unknown author';

                    // Publication year with get
                    const year = get( bookDetails, 'first_publish_date' ) ||
                        get( work, 'first_publish_year' ) ||
                        'Unknown year';

                    // Populate the modal
                    modalBody.innerHTML = `
            <div class="modal-details">
                <div class="modal-details-content">
                    <h2 id="modal-title">${work.title}</h2>
                    <p><strong>Author:</strong> ${authors}</p>
                    <p><strong>Year:</strong> ${year}</p>
                    <h3>Description</h3>
                    <p class="modal-description">${description}</p>
                </div>
            </div>
        `;

                } catch ( error ) {
                    const modalBody = document.getElementById( 'modal-body' );
                    modalBody.innerHTML = `
            <div class="modal-error">
                <p class="modal-error-title">⚠️ Error loading details</p>
                <p class="modal-error-message">${error.message}</p>
            </div>
        `;
                }
            }

            appDiv.appendChild( card );
        } );
        // Hide loading spinner
        loadingDiv.style.display = 'none';
    }
    catch ( error ) {
        console.error( error );
        // Show error in loading div
        const loadingDiv = document.getElementById( 'loading' );
        loadingDiv.style.display = 'block';

        // Custom error messages
        let errorMessage = error.message;
        if ( error.code === 'ECONNABORTED' ) {
            errorMessage = 'Server too slow. Please try again.';
        } else if ( error.response?.status === 404 ) {
            errorMessage = 'No books found for this search.';
        } else if ( !navigator.onLine ) {
            errorMessage = 'No internet connection.';
        }

        loadingDiv.innerHTML = `⚠️ ${errorMessage}`;
        loadingDiv.classList.add( 'error' );

        // Hide error after 5 seconds
        setTimeout( () => {
            loadingDiv.style.display = 'none';
            loadingDiv.classList.remove( 'error' );
            loadingDiv.innerHTML = '⏳ Loading...';
        }, 5000 );

        // Clear app div
        const appDiv = document.getElementById( 'app' );
        appDiv.innerHTML = '';
    }
}

