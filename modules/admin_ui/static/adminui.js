$.get("/admin/menu/", function (data, err) {

  $("body").prepend(data);

});

