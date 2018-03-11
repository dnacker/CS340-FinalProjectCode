function deleteAscent(cid, pid) {
    $.ajax({
        url: '/logbook/' + cid + '/' + pid,
        type: 'DELETE',
        success: function(result) {
            window.location.reload(true);
        }
    });
};

/*
function addAscents(cid) {
    var values = getCheckBoxValues();
    $.ajax({
        url: '/logbook/' + cid + "/" + values,
        type: 'POST',
        success: function(result) {
            window.location.reload(true);
        }
    });
}

function getCheckBoxValues() {
    return $("input[name=zoneproblems]:checked").map(
        function() {
            return this.value;
        }).get().join(",");
}
*/