// Example app
import Deckly from "../../src";

const IMD_DOMAINS = ["IMD18_mean", "Access_mean", "Crime_mean", "Education_mean", "Employment_mean", "Health_mean", "Housing_mean", "Income_mean"]

Deckly({
    title: "Cancer distribution in NZ",
    data: "https://uoa-eresearch.github.io/cancermap/data/TALB_2018.geojson",
    //colorBy: d => d.properties.cancer["total 18+ all cancertotal2016-2018"] / d.properties.smoking["total_15+"] * 100,
    colorBy: d => [d.properties.cancer["total 18+ all cancertotal2016-2018"] / d.properties.smoking["total_15+"] * 100,
                   d.properties.IMD18_mean],
    colorScale: ["Blues", "Reds"],
    hoverMessage: d => d.properties.TALB2018_1,
    perText: "Display cancer/smoking values as per 100K people",
    perFunc: d => {
        const RATE_PER = 1E5;
        var f = JSON.parse(JSON.stringify(d))
        console.log(f);
        for (var subkey of ["cancer", "smoking"]) {
            for (var k in f[subkey]) {
                if (k.includes("total")) {
                    f[subkey][k] = f[subkey][k] / f.age.Total.Total * RATE_PER
                } else if (k.includes("non-maori")) {
                    f[subkey][k] = f[subkey][k] / f.age["Non-maori"].Total * RATE_PER
                } else {
                    f[subkey][k] = f[subkey][k] / f.age["Maori"].Total * RATE_PER
                }
            }
        }
        return f
    },
    legendTitle: "Cancer registrations from 2016-2018 divided by 2018 adult population (percentage) vs deprivation",
    legendLabels: ["Cancer ->", "Deprivation ->"],
    //limits: [1,3],
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
            title: d => `Cancer types in ${d ? d.properties.TALB2018_1 : "NZ"} from 2016-2018`,
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
            title: d => `Smoking in ${d ? d.properties.TALB2018_1 : "NZ"} as per the 2018 census`,
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
            title: d => `Age distribution in ${d ? d.properties.TALB2018_1 : "NZ"} as per the 2018 census`,
            barmode: 'stack',
        }
    },
    {
        id: "deprivation",
        data: data => [
            {
                x: IMD_DOMAINS.map(k => k.replace("_mean", "")),
                y: IMD_DOMAINS.map(k => data.aggregate ? data[k] / 86 : data[k]),
                type: 'line',
            }
        ],
        layout: {
            title: d => `Deprivation in ${d ? d.properties.TALB2018_1 : "NZ"}`,
        }
    }]
})