function deleteAscent(cid, pid) {
    var confirmDelete = confirm("Are you sure you want to delete this ascent?");
    if (confirmDelete) {
        $.ajax({
            url: '/logbook/' + cid + '/' + pid,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    }
};