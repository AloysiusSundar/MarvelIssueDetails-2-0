$(document).ready(function() {
    $('#issueTitle').autocomplete({
        source: function(request, response) {
            const publicKey = 'api';
            const privateKey = 'api';
            const ts = new Date().getTime();
            const hash = CryptoJS.MD5(ts + privateKey + publicKey).toString();

            const url = `https://gateway.marvel.com/v1/public/comics?titleStartsWith=${encodeURIComponent(request.term)}&ts=${ts}&apikey=${publicKey}&hash=${hash}`;

            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function(data) {
                    const results = data.data.results.map(function(comic) {
                        return {
                            label: comic.title,
                            value: comic.title,
                            id: comic.id // Optionally store comic ID for fetching details later
                        };
                    });
                    response(results);
                },
                error: function(err) {
                    console.error('Error fetching autocomplete suggestions:', err);
                    response([]);
                }
            });
        },
        minLength: 3, // Minimum characters before autocomplete starts
        select: function(event, ui) {
            // Handle selection of autocomplete suggestion
            fetchComicDetails(ui.item.id); // Fetch details using comic ID (optional)
        }
    });

    $('#searchForm').submit(function(event) {
        event.preventDefault();
        const issueTitle = $('#issueTitle').val().trim();
        if (!issueTitle) {
            alert('Please enter a comic issue title.');
            return;
        }

        // Optionally fetch details using title (fallback)
        fetchComicDetails();
    });

    function fetchComicDetails(comicId) {
        const publicKey = 'api';
        const privateKey = 'api';
        const ts = new Date().getTime();
        const hash = CryptoJS.MD5(ts + privateKey + publicKey).toString();

        let url = `https://gateway.marvel.com/v1/public/comics`;
        if (comicId) {
            url += `/${comicId}`; // Append comic ID if provided
        } else {
            const issueTitle = $('#issueTitle').val().trim();
            url += `?title=${encodeURIComponent(issueTitle)}`; // Fallback to title search
        }
        url += `?ts=${ts}&apikey=${publicKey}&hash=${hash}`;

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.data.results.length > 0) {
                    const comic = data.data.results[0];
                    displayComicDetails(data.data.results[0]);
                    updateBackground(data.data.results[0])
                } else {
                    $('#comicDetails').html('<p>No comic details found.</p>');
                    
                }
            },
            error: function(err) {
                console.error('Error fetching comic details:', err);
                $('#comicDetails').html('<p>Error fetching comic details. Please try again.</p>');
            }
        });
    }

    function displayComicDetails(comic) {
        const comicDetailsDiv = $('#comicDetails');
        comicDetailsDiv.empty();
    
        const detailsList = $('<ul></ul>');
        detailsList.append(`<li><strong>Title:</strong> ${comic.title}</li>`);
        detailsList.append(`<li><strong>Issue Number:</strong> ${comic.issueNumber}</li>`);
    
        // Display extended credits and info
        detailsList.append('<li><strong>Extended Credits and Info:</strong></li>');
        detailsList.append('<ul>');
    
        // Stories section
        if (comic.creators.available > 0) {
            const stories = comic.creators.items.filter(creator => creator.role === 'writer' || creator.role === 'penciller' || creator.role === 'inker' || creator.role === 'letterer' || creator.role === 'editor');
            if (stories.length > 0) {
                detailsList.append('<li><strong>STORIES</strong></li>');
                const writers = stories.filter(creator => creator.role === 'writer').map(creator => creator.name).join(', ');
                if (writers) {
                    detailsList.append(`<li><strong>Writer:</strong> ${writers}</li>`);
                }
                const pencillers = stories.filter(creator => creator.role === 'penciller').map(creator => creator.name).join(', ');
                if (pencillers) {
                    detailsList.append(`<li><strong>Penciller:</strong> ${pencillers}</li>`);
                }
                const inkers = stories.filter(creator => creator.role === 'inker').map(creator => creator.name).join(', ');
                if (inkers) {
                    detailsList.append(`<li><strong>Inker:</strong> ${inkers}</li>`);
                }
                const letterers = stories.filter(creator => creator.role === 'letterer').map(creator => creator.name).join(', ');
                if (letterers) {
                    detailsList.append(`<li><strong>Letterer:</strong> ${letterers}</li>`);
                }
                const editors = stories.filter(creator => creator.role === 'editor').map(creator => creator.name).join(', ');
                if (editors) {
                    detailsList.append(`<li><strong>Editor:</strong> ${editors}</li>`);
                }
            }
        }
    
        // Cover information section
        if (comic.creators.available > 0) {
            const coverInfo = comic.creators.items.filter(creator => creator.role === 'cover artist' || creator.role === 'cover inker' || creator.role === 'cover colorist' || creator.role === 'editor');
            if (coverInfo.length > 0) {
                detailsList.append('<li><strong>COVER INFORMATION</strong></li>');
                const coverArtists = coverInfo.filter(creator => creator.role === 'cover artist').map(creator => creator.name).join(', ');
                if (coverArtists) {
                    detailsList.append(`<li><strong>Cover Artist:</strong> ${coverArtists}</li>`);
                }
                const coverInkers = coverInfo.filter(creator => creator.role === 'cover inker').map(creator => creator.name).join(', ');
                if (coverInkers) {
                    detailsList.append(`<li><strong>Inker (Cover):</strong> ${coverInkers}</li>`);
                }
                const coverColorists = coverInfo.filter(creator => creator.role === 'cover colorist').map(creator => creator.name).join(', ');
                if (coverColorists) {
                    detailsList.append(`<li><strong>Colorist (Cover):</strong> ${coverColorists}</li>`);
                }
                const coverEditors = coverInfo.filter(creator => creator.role === 'editor').map(creator => creator.name).join(', ');
                if (coverEditors) {
                    detailsList.append(`<li><strong>Editor:</strong> ${coverEditors}</li>`);
                }
            }
        }
    
        // Additional info like UPC, FOC Date, Page Count
        detailsList.append('<li><strong>Additional Info:</strong></li>');
        detailsList.append('<ul>');
        if (comic.upc) {
            detailsList.append(`<li>UPC: ${comic.upc}</li>`);
        }
        if (comic.dates.length > 0) {
            comic.dates.forEach(date => {
                if (date.type === 'focDate') {
                    detailsList.append(`<li>FOC Date: ${new Date(date.date).toLocaleDateString()}</li>`);
                }
            });
        }
        if (comic.pageCount) {
            detailsList.append(`<li>Page Count: ${comic.pageCount}</li>`);
        }
        detailsList.append('</ul>');
    
        detailsList.append('</ul>');
    
        if (comic.images.length > 0) {
            detailsList.append(`<li><strong></strong> <img src="${comic.images[0].path}.${comic.images[0].extension}" alt="Cover Image"></li>`);
        }
    
        comicDetailsDiv.append(detailsList);
    }
    function updateBackground(comic) {
        const coverImage = comic.images.length > 0 ? `${comic.images[0].path}.${comic.images[0].extension}` : '';
        if (coverImage) {
            $('#comicCoverBackground').css('background-image', `url(${coverImage})`);
        } else {
            $('#comicCoverBackground').css('background-image', 'none');
        }
    }
    
});
