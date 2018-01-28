window.onload = function () {
    var ajv = new Ajv({ allErrors:  true});

    ajv.addKeyword('discriminator', {
        type: 'object',
        compile: function (sch, parentSchema, ctx) {
            var pn = sch.propertyName;
            ctx.resolveRef(ctx.baseId, "#/definitions/Encounter", ctx.isRoot);
            var vv = function (data, dataPath, parentData, pName, rootData) {
                var tp = data[pn];
                var idx = ctx.root.refs['#/definitions/' + tp];
                var v = ctx.root.refVal[idx];
                var res = v(data, dataPath, parentData, pName, rootData);
                vv.errors = v.errors;
                return res;
            };
            return vv;
        }
    });


    var url = 'fhir.schema.json';
    // var url = 'https://build.fhir.org/fhir.schema.json';

    var validate = null;
    fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res => res.json())
        .catch(error => console.error('Error:', error))
        .then(response => {
            delete response["$schema"];
            delete response["oneOf"];
            validate = ajv.compile(response);
            console.log(response);
            console.log("We have it", validate);
        }).catch(error => console.error('Error:', error)) ;


    var editor = CodeMirror.fromTextArea(document.getElementById('input'), {
        theme: "default",
        mode: "application/json",
        gutters: ["CodeMirror-lint-markers"],
        lint: true,
        lineNumbers: true
    });

    editor.setValue(JSON.stringify({resourceType: "Patient"}));

    editor.on("change", function(x) {
        // console.log("ch", x, editor.getValue())
        if(validate){
            try {
                var res = JSON.parse(editor.getValue());
                var errors = validate(res);
                if(!errors){
                    // console.log("Errors", validate.errors);
                    document.getElementById('errors').innerHTML =
                        validate.errors.map((x)=> "<li class='error'><b>" + x.dataPath + "</b> " + x.message + " (" + JSON.stringify(x.params) + ")</li>").join("");
                } else {
                    document.getElementById('errors').innerHTML = '<li class="success">Valid</li>'
                }
            } catch (e) {

                document.getElementById('errors').innerHTML = '<li class="error">' + e.message + '</li>';

            }
        }


    });

};
