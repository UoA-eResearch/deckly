// Example app
import Deckly from "./lib";

Deckly({
    title: "Cancer distribution in NZ",
    data: "https://uoa-eresearch.github.io/cancermap/data/TALB_2018.geojson",
    colorBy: d => d.properties.cancer["total 18+ all cancertotal2016-2018"],
    plots: [{
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
            title: "Cancer types in NZ from 2016-2018"
        }
    }]
})