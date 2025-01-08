SHELL = env bash
DEVELOP = nix --extra-experimental-features nix-command --extra-experimental-features flakes develop

develop:
	$(DEVELOP)

clean:
	rm -rdf nutrient-file

index.html:
	nix run nixpkgs#babashka server.clj $@ > $@

nutrient-file:
	mkdir $@
	curl "https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/fn-an/alt_formats/zip/nutrition/fiche-nutri-data/cnf-fcen-csv.zip" -o $@/temp.zip
	cd $@ && unzip temp.zip
	rm $@/temp.zip

food.sqlite: nutrient-file
	cd $< && find . -name "*.csv" | sed 's,./,,' | sed 's,.csv,,' | while read -r line; do echo ".import '$$line.csv' $${line// /_} --csv"; done | sqlite3 ../$@
