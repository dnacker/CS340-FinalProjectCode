function reset() {
    window.location.replace('/problems');
}

function filterStyles() {
    var styleFilter = document.getElementById('styleFilter');
    var val = styleFilter.value;
    window.location.replace('/problems/styles/' + val);
}

$(document).ready(function() {
    var url = window.location.href;
    if (url.indexOf('styles') > 0) {
        var styleId = url.substring(url.indexOf('styles') + 7);
        var styleFilter = document.getElementById('styleFilter');
        console.log(styleId);
        styleFilter.value = styleId;
    }
});

function deleteProblem(id) {
    var confirmDelete = confirm("Are you sure you want to delete this problem?");
    if (confirmDelete) {
        $.ajax({
            url: '/problems/' + id,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    }
};