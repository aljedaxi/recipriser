(ns server
  (:require [babashka.fs :as fs]
            [babashka.cli :as cli]
            [babashka.pods :as pods]
            [babashka.deps :as deps]
            [clojure.string :as str]
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

(def foodSelect {:select [:MeasureDescription :FoodDescription :FoodID]
                 :from [:FOOD_NAME]
                 :join [:CONVERSION-FACTOR [:using :FoodID]
                        :MEASURE-NAME [:using :MeasureID]]
                 :where [:in :FoodGroupID foodGroupSelect]})

(defn s->option [s] [:option s])

(defn description->option [{description :FoodDescription id :FoodID}]
  [:option {:id id :value description}])

(def foods (query foodSelect))
(def byId (->> foods (group-by :FoodID)))
(def foodIds (keys byId))

(def foodNameOptions
  (->> foods
       (group-by :FoodID)
       (map (fn [[FoodID xs]]
         {:FoodID FoodID
          :FoodDescription (:FoodDescription (first xs))
          :MeasureDescription (str/join ";" (map :MeasureDescription xs))}))
       (map (fn [{:keys [FoodDescription FoodID MeasureDescription ]}]
         [:option {:id FoodID :value FoodDescription :data-measure MeasureDescription}]))))

(def cookfileOptions
  (->> (fs/list-dir "./cook")
       (map str)
       (map s->option)))

;; (defn tiptappn []
;;   [:html
;;        [:head
;;         [:meta {:charset "UTF-8"}]
;;         [:datalist {:id "food-names"} foodNameOptions]
;;         [:datalist {:id "cook-files"} cookfileOptions]
;;         [:script {:type "module" :src "tiptap.js"}]
;;         [:script {:type "module" :src "index.js"}]
;;         [:style "div#editor { min-height: 1lh };"]
;;         [:title "le ebin recipe enterer"]]
;;        [:body
;;         [:h1 "i exist! and i think that's pretty cool."]
;;         [:button.dialogpopper {:popovertarget "cookfiles"} "load existing file"]
;;         [:dialog#cookfiles
;;          [:form {:method "dialog"}
;;           [:label {:id "cook-file-name"}
;;            "cookfile name"
;;            [:input {:list "cook-files" :name "filename" :autofocus "true"}]
;;            [:button {:type "submit"} "Confirm"]]]]
;;         [:dialog.food
;;          [:form {:method "dialog"}
;;            [:input {:list "food-names" :name "food" :autofocus "true"}]
;;            [:button {:type "submit"} "Confirm"]]]
;;         [:form {:method "POST"}
;;           [:div#editor {:name "recipe"}]]]])

(def concrete "https://cdnjs.cloudflare.com/ajax/libs/concrete.css/3.0.0/concrete.min.css")

(defn index.html []
  (-> [:html
       [:head
        [:meta {:charset "UTF-8"}]
        [:datalist {:id "food-names"} foodNameOptions]
        [:datalist {:id "cook-files"} cookfileOptions]
        [:script {:type "module" :src "index.js"}]
        [:script {:type "module" :src "custom-editor.js"}]
        [:style "div#editor { min-height: 1lh };"]
        [:link {:rel "stylesheet" :href concrete}]
        [:link {:rel "stylesheet" :href "./index.css"}]
        [:title "le ebin recipe enterer"]]
       [:body
        [:main
         [:h1 "enter recipe man"]
         [:custom-editor]]]]
      html/html
      str))

(defn -main [{:keys [filename] :as opts}]
  (let [fn (get {:index.html index.html} (keyword filename))]
    (println (fn))))

(def cli-spec
  {:args->opts [:filename]})

(-main (cli/parse-opts *command-line-args* cli-spec))
