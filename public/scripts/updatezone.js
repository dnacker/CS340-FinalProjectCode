function updateZone(id) {
    $.ajax({
        url: '/zones/' + id,
        type: 'PUT',
        data: $('#update-zone').serialize(),
        success: function(result) {
            window.location.replace("./");
        }
    });
};