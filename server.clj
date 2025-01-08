(ns server
  (:require [babashka.fs :as fs]
            [babashka.cli :as cli]
            [babashka.pods :as pods]
            [babashka.deps :as deps]
            [hiccup2.core :as html]))

(pods/load-pod 'org.babashka/go-sqlite3 "0.1.0")
(deps/add-deps '{:deps {honeysql/honeysql {:mvn/version "1.0.444"}}})
(require '[pod.babashka.go-sqlite3 :as sqlite]
         '[honeysql.core :as sql]
         '[honeysql.helpers :as helpers])

(def groupsWeWant ["Dairy and Egg Products"
                   "Spices and Herbs"
                   "Fats and Oils"
                   "Poultry Products"
                   "Soups, Sauces and Gravies"
                   "Sausages and Luncheon meats"
                   "Fruits and fruit juices"
                   "Pork Products"
                   "Vegetables and Vegetable Products"
                   "Nuts and Seeds"
                   "Beef Products"
                   "Beverages"
                   "Finfish and Shellfish Products"
                   "Legumes and Legume Products"
                   "Lamb, Veal and Game"
                   "Cereals, Grains and Pasta"
                   "Snacks"])

(def db "food.sqlite")
(defn query [shitIdk]
  (sqlite/query db (sql/format shitIdk)))

(def foodGroupSelect {:select [:FoodGroupID]
                :from [:FOOD_GROUP]
                :where [:in :FoodGroupName groupsWeWant]})

(def foodSelect {:select [:FoodDescription :FoodID]
                 :from [:FOOD_NAME]
                 :where [:in :FoodGroupID foodGroupSelect]})

(defn description->option [{description :FoodDescription id :FoodID}]
  [:option {:value :FoodID} description])

(def foodNameOptions
  (->> (query foodSelect)
       (map description->option)))

(defn index []
  (-> [:html
       [:head
        [:meta {:charset "UTF-8"}]
        [:datalist {:id "food-names"} foodNameOptions]
        [:title "le ebin recipe enterer"]]
       [:body
        [:h1 "i exist! and i think that's pretty cool."]]]
      html/html
      str))

(defn -main [{:keys [filename] :as opts}]
  (let [fn (get {:index.html index} (keyword filename))]
    (println (fn))))

(def cli-spec
  {:args->opts [:filename]})

(-main (cli/parse-opts *command-line-args* cli-spec))
