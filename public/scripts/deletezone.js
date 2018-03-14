$(document).ready(function() {
    $("#zones-link").addClass("active");
});

function deleteZone(id) {
    var confirmDelete = confirm("Are you sure you want to delete this zone?");
    if (confirmDelete) {
        $.ajax({
            url: '/zones/' + id,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    }
};