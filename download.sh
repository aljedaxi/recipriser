json=`nix run github:aljedaxi/json-ld-extractor $1`
name=`echo ${json} | jq .name | sed 's/"//g'`
echo ${json} | nix run github:aljedaxi/jsonld-2-cooklang > cook/"${name// /_}".cook
