

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('updateForm');
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); 

        // form values from profile.ejs
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const bio = document.getElementById('bio').value;

        try {
            // send data to server
            const response = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, bio }),
            });

            const result = await response.json();
            if (response.ok) {
                // update values on profile.ejs page
                document.getElementById('updatedName').textContent = `Name: ${result.user.accountName}`;
                document.getElementById('updatedEmail').textContent = `Contact Email: ${result.user.accountEmail}`;
                document.getElementById('updatedBio').textContent = `Bio: ${result.user.bio}`;
                console.log(result.user.accountEmail);
            } else {
                alert(result.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('ERROR, profile not updated', error);
        }
    });
});