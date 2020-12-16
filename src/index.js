// Example app
import Deckly from "./lib";

Deckly({
    title: "Cancer distribution in NZ",
    data: "https://uoa-eresearch.github.io/cancermap/data/TALB_2018.geojson",
    colorBy: d => d.properties.cancer["total 18+ all cancertotal2016-2018"],
    perText: "Display cancer/smoking values as per 100K people",
    plots: [{
        id: "cancertypes",
        style: {
            width: "50%",
        },
        data: ({cancer}) => [ 
            {
                name: "Māori",
                x: ["Breast cancer", "Prostate cancer", "Lung cancer"],
                y: [cancer["breastmaori2016-2018"], cancer["prostatemaori2016-2018"], cancer["lungmaori2016-2018"]],
                type: 'bar',
            },
            {
                name: "Non-māori",
                x: ["Breast cancer", "Prostate cancer", "Lung cancer"],
                y: [cancer["breastnon-maori2016-2018"], cancer["prostatenon-maori2016-2018"], cancer["lungnon-maori2016-2018"]],
                type: 'bar',
            }
        ],
        layout: {
            title: "Cancer types in NZ from 2016-2018",
            barmode: 'stack',
        }
    },
    {
        id: "smoking",
        style: {
            width: "50%",
        },
        data: ({smoking}) => [
            {
                name: "Māori",
                x: ["Male smoker", "Male non-smoker", "Female smoker", "Female non-smoker"],
                y: [smoking["maori_male_smoker"], smoking["maori_male_non-smoker"], smoking["maori_female_smoker"], smoking["maori_female_non-smoker"]],
                type: 'bar',
            },
            {
                name: "Non-māori",
                x: ["Male smoker", "Male non-smoker", "Female smoker", "Female non-smoker"],
                y: [smoking["non-maori_male_smoker"], smoking["non-maori_male_non-smoker"], smoking["non-maori_female_smoker"], smoking["non-maori_female_non-smoker"]],
                type: 'bar',
            }
        ],
        layout: {
            title: "Smoking in NZ as per the 2018 census",
            barmode: 'stack',
        }
    },
    {
        id: "age_distribution",
        data: ({age}) => [
            {
                name: "Māori",
                x: Object.keys(age.Maori).filter(k => k != "Total"),
                y: Object.keys(age.Maori).filter(k => k != "Total").map(k => age.Maori[k]),
                type: 'bar',
            },
            {
                name: "Non-māori",
                x: Object.keys(age["Non-maori"]).filter(k => k != "Total"),
                y: Object.keys(age["Non-maori"]).filter(k => k != "Total").map(k => age["Non-maori"][k]),
                type: 'bar',
            }
        ],
        layout: {
            title: "Age distribution in NZ as per the 2018 census",
            barmode: 'stack',
        }
    }]
})