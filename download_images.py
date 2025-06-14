import os
import requests
import json

# Hardcoded the car models and brands from `carDatabase.js` directly into the script, ensuring the image paths remain consistent with the original database.
car_database = [
    {
        "brand": "Toyota",
        "models": [
            {"name": "Corolla", "releaseYear": 1966, "image": "src/assets/car_images/toyota_corolla.jpg"},
            {"name": "Camry", "releaseYear": 1982, "image": "src/assets/car_images/toyota_camry.jpg"},
            {"name": "Prius", "releaseYear": 1997, "image": "src/assets/car_images/toyota_prius.jpg"},
            {"name": "RAV4", "releaseYear": 1994, "image": "src/assets/car_images/toyota_rav4.jpg"},
            {"name": "Highlander", "releaseYear": 2000, "image": "src/assets/car_images/toyota_highlander.jpg"},
            {"name": "Land Cruiser", "releaseYear": 1951, "image": "src/assets/car_images/toyota_land_cruiser.jpg"},
            {"name": "Supra", "releaseYear": 1978, "image": "src/assets/car_images/toyota_supra.jpg"},
            {"name": "Yaris", "releaseYear": 1999, "image": "src/assets/car_images/toyota_yaris.jpg"},
        ]
    },
    {
        "brand": "Ford",
        "models": [
            {"name": "F-150", "releaseYear": 1948, "image": "src/assets/car_images/ford_f150.jpg"},
            {"name": "Mustang", "releaseYear": 1964, "image": "src/assets/car_images/ford_mustang.jpg"},
            {"name": "Explorer", "releaseYear": 1990, "image": "src/assets/car_images/ford_explorer.jpg"},
            {"name": "Focus", "releaseYear": 1998, "image": "src/assets/car_images/ford_focus.jpg"},
            {"name": "Escape", "releaseYear": 2000, "image": "src/assets/car_images/ford_escape.jpg"},
            {"name": "Bronco", "releaseYear": 1966, "image": "src/assets/car_images/ford_bronco.jpg"},
            {"name": "Ranger", "releaseYear": 1983, "image": "src/assets/car_images/ford_ranger.jpg"},
            {"name": "Fiesta", "releaseYear": 1976, "image": "src/assets/car_images/ford_fiesta.jpg"},
        ]
    },
    {
        "brand": "Honda",
        "models": [
            {"name": "Civic", "releaseYear": 1972, "image": "src/assets/car_images/honda_civic.jpg"},
            {"name": "Accord", "releaseYear": 1976, "image": "src/assets/car_images/honda_accord.jpg"},
            {"name": "CR-V", "releaseYear": 1995, "image": "src/assets/car_images/honda_crv.jpg"},
            {"name": "Pilot", "releaseYear": 2002, "image": "src/assets/car_images/honda_pilot.jpg"},
            {"name": "Fit", "releaseYear": 2001, "image": "src/assets/car_images/honda_fit.jpg"},
            {"name": "Odyssey", "releaseYear": 1994, "image": "src/assets/car_images/honda_odyssey.jpg"},
            {"name": "HR-V", "releaseYear": 1998, "image": "src/assets/car_images/honda_hrv.jpg"},
            {"name": "Ridgeline", "releaseYear": 2005, "image": "src/assets/car_images/honda_ridgeline.jpg"},
        ],
    },
    {
        "brand": "Chevrolet",
        "models": [
            {"name": "Silverado", "releaseYear": 1998, "image": "src/assets/car_images/chevrolet_silverado.jpg"},
            {"name": "Malibu", "releaseYear": 1964, "image": "src/assets/car_images/chevrolet_malibu.jpg"},
            {"name": "Equinox", "releaseYear": 2004, "image": "src/assets/car_images/chevrolet_equinox.jpg"},
            {"name": "Tahoe", "releaseYear": 1995, "image": "src/assets/car_images/chevrolet_tahoe.jpg"},
            {"name": "Impala", "releaseYear": 1958, "image": "src/assets/car_images/chevrolet_impala.jpg"},
            {"name": "Camaro", "releaseYear": 1966, "image": "src/assets/car_images/chevrolet_camaro.jpg"},
            {"name": "Suburban", "releaseYear": 1935, "image": "src/assets/car_images/chevrolet_suburban.jpg"},
            {"name": "Blazer", "releaseYear": 1969, "image": "src/assets/car_images/chevrolet_blazer.jpg"},
        ],
    },
    {
        "brand": "BMW",
        "models": [
            {"name": "3 Series", "releaseYear": 1975, "image": "src/assets/car_images/bmw_3_series.jpg"},
            {"name": "5 Series", "releaseYear": 1972, "image": "src/assets/car_images/bmw_5_series.jpg"},
            {"name": "X5", "releaseYear": 1999, "image": "src/assets/car_images/bmw_x5.jpg"},
            {"name": "X3", "releaseYear": 2003, "image": "src/assets/car_images/bmw_x3.jpg"},
            {"name": "7 Series", "releaseYear": 1977, "image": "src/assets/car_images/bmw_7_series.jpg"},
            {"name": "1 Series", "releaseYear": 2004, "image": "src/assets/car_images/bmw_1_series.jpg"},
            {"name": "Z4", "releaseYear": 2002, "image": "src/assets/car_images/bmw_z4.jpg"},
            {"name": "i3", "releaseYear": 2013, "image": "src/assets/car_images/bmw_i3.jpg"},
        ],
    },
    {
        "brand": "Mercedes-Benz",
        "models": [
            {"name": "C-Class", "releaseYear": 1993, "image": "src/assets/car_images/mercedes_benz_c_class.jpg"},
            {"name": "E-Class", "releaseYear": 1953, "image": "src/assets/car_images/mercedes_benz_e_class.jpg"},
            {"name": "S-Class", "releaseYear": 1972, "image": "src/assets/car_images/mercedes_benz_s_class.jpg"},
            {"name": "GLC", "releaseYear": 2015, "image": "src/assets/car_images/mercedes_benz_glc.jpg"},
            {"name": "GLE", "releaseYear": 1997, "image": "src/assets/car_images/mercedes_benz_gle.jpg"},
            {"name": "A-Class", "releaseYear": 1997, "image": "src/assets/car_images/mercedes_benz_a_class.jpg"},
            {"name": "CLA", "releaseYear": 2013, "image": "src/assets/car_images/mercedes_benz_cla.jpg"},
            {"name": "G-Class", "releaseYear": 1979, "image": "src/assets/car_images/mercedes_benz_g_class.jpg"},
        ],
    },
    {
        "brand": "Audi",
        "models": [
            {"name": "A4", "releaseYear": 1994, "image": "src/assets/car_images/audi_a4.jpg"},
            {"name": "A6", "releaseYear": 1994, "image": "src/assets/car_images/audi_a6.jpg"},
            {"name": "Q5", "releaseYear": 2008, "image": "src/assets/car_images/audi_q5.jpg"},
            {"name": "Q7", "releaseYear": 2005, "image": "src/assets/car_images/audi_q7.jpg"},
            {"name": "A3", "releaseYear": 1996, "image": "src/assets/car_images/audi_a3.jpg"},
            {"name": "TT", "releaseYear": 1998, "image": "src/assets/car_images/audi_tt.jpg"},
            {"name": "R8", "releaseYear": 2006, "image": "src/assets/car_images/audi_r8.jpg"},
            {"name": "Q3", "releaseYear": 2011, "image": "src/assets/car_images/audi_q3.jpg"},
        ],
    },
    {
        "brand": "Nissan",
        "models": [
            {"name": "Altima", "releaseYear": 1992, "image": "src/assets/car_images/nissan_altima.jpg"},
            {"name": "Sentra", "releaseYear": 1982, "image": "src/assets/car_images/nissan_sentra.jpg"},
            {"name": "Rogue", "releaseYear": 2007, "image": "src/assets/car_images/nissan_rogue.jpg"},
            {"name": "Pathfinder", "releaseYear": 1985, "image": "src/assets/car_images/nissan_pathfinder.jpg"},
            {"name": "Leaf", "releaseYear": 2010, "image": "src/assets/car_images/nissan_leaf.jpg"},
            {"name": "370Z", "releaseYear": 2009, "image": "src/assets/car_images/nissan_370z.jpg"},
            {"name": "GT-R", "releaseYear": 2007, "image": "src/assets/car_images/nissan_gtr.jpg"},
            {"name": "Murano", "releaseYear": 2002, "image": "src/assets/car_images/nissan_murano.jpg"},
        ],
    },
    {
        "brand": "Hyundai",
        "models": [
            {"name": "Elantra", "releaseYear": 1990, "image": "src/assets/car_images/hyundai_elantra.jpg"},
            {"name": "Sonata", "releaseYear": 1985, "image": "src/assets/car_images/hyundai_sonata.jpg"},
            {"name": "Tucson", "releaseYear": 2004, "image": "src/assets/car_images/hyundai_tucson.jpg"},
            {"name": "Santa Fe", "releaseYear": 2000, "image": "src/assets/car_images/hyundai_santa_fe.jpg"},
            {"name": "Kona", "releaseYear": 2017, "image": "src/assets/car_images/hyundai_kona.jpg"},
            {"name": "Veloster", "releaseYear": 2011, "image": "src/assets/car_images/hyundai_veloster.jpg"},
            {"name": "Palisade", "releaseYear": 2018, "image": "src/assets/car_images/hyundai_palisade.jpg"},
            {"name": "Ioniq", "releaseYear": 2016, "image": "src/assets/car_images/hyundai_ioniq.jpg"},
        ],
    },
    {
        "brand": "Volkswagen",
        "models": [
            {"name": "Golf", "releaseYear": 1974, "image": "src/assets/car_images/volkswagen_golf.jpg"},
            {"name": "Passat", "releaseYear": 1973, "image": "src/assets/car_images/volkswagen_passat.jpg"},
            {"name": "Tiguan", "releaseYear": 2007, "image": "src/assets/car_images/volkswagen_tiguan.jpg"},
            {"name": "Jetta", "releaseYear": 1979, "image": "src/assets/car_images/volkswagen_jetta.jpg"},
            {"name": "Atlas", "releaseYear": 2017, "image": "src/assets/car_images/volkswagen_atlas.jpg"},
            {"name": "Beetle", "releaseYear": 1938, "image": "src/assets/car_images/volkswagen_beetle.jpg"},
            {"name": "Touareg", "releaseYear": 2002, "image": "src/assets/car_images/volkswagen_touareg.jpg"},
            {"name": "ID.4", "releaseYear": 2020, "image": "src/assets/car_images/volkswagen_id4.jpg"},
        ],
    },
    {
        "brand": "Tesla",
        "models": [
            {"name": "Model S", "releaseYear": 2012, "image": "src/assets/car_images/tesla_model_s.jpg"},
            {"name": "Model 3", "releaseYear": 2017, "image": "src/assets/car_images/tesla_model_3.jpg"},
            {"name": "Model X", "releaseYear": 2015, "image": "src/assets/car_images/tesla_model_x.jpg"},
            {"name": "Model Y", "releaseYear": 2020, "image": "src/assets/car_images/tesla_model_y.jpg"},
            {"name": "Cybertruck", "releaseYear": 2021, "image": "src/assets/car_images/tesla_cybertruck.jpg"},
            {"name": "Roadster", "releaseYear": 2008, "image": "src/assets/car_images/tesla_roadster.jpg"},
        ],
    },
    {
        "brand": "Subaru",
        "models": [
            {"name": "Outback", "releaseYear": 1994, "image": "src/assets/car_images/subaru_outback.jpg"},
            {"name": "Forester", "releaseYear": 1997, "image": "src/assets/car_images/subaru_forester.jpg"},
            {"name": "Impreza", "releaseYear": 1992, "image": "src/assets/car_images/subaru_impreza.jpg"},
            {"name": "Crosstrek", "releaseYear": 2012, "image": "src/assets/car_images/subaru_crosstrek.jpg"},
            {"name": "Ascent", "releaseYear": 2018, "image": "src/assets/car_images/subaru_ascent.jpg"},
            {"name": "BRZ", "releaseYear": 2012, "image": "src/assets/car_images/subaru_brz.jpg"},
            {"name": "Legacy", "releaseYear": 1989, "image": "src/assets/car_images/subaru_legacy.jpg"},
        ],
    },
    {
        "brand": "Mazda",
        "models": [
            {"name": "Mazda3", "releaseYear": 2003, "image": "src/assets/car_images/mazda_mazda3.jpg"},
            {"name": "Mazda6", "releaseYear": 2002, "image": "src/assets/car_images/mazda_mazda6.jpg"},
            {"name": "CX-5", "releaseYear": 2012, "image": "src/assets/car_images/mazda_cx5.jpg"},
            {"name": "CX-9", "releaseYear": 2006, "image": "src/assets/car_images/mazda_cx9.jpg"},
            {"name": "MX-5 Miata", "releaseYear": 1989, "image": "src/assets/car_images/mazda_mx5_miata.jpg"},
            {"name": "CX-30", "releaseYear": 2019, "image": "src/assets/car_images/mazda_cx30.jpg"},
            {"name": "RX-8", "releaseYear": 2003, "image": "src/assets/car_images/mazda_rx8.jpg"},
        ],
    },
    {
        "brand": "Kia",
        "models": [
            {"name": "Soul", "releaseYear": 2008, "image": "src/assets/car_images/kia_soul.jpg"},
            {"name": "Sportage", "releaseYear": 1993, "image": "src/assets/car_images/kia_sportage.jpg"},
            {"name": "Sorento", "releaseYear": 2002, "image": "src/assets/car_images/kia_sorento.jpg"},
            {"name": "Optima", "releaseYear": 2000, "image": "src/assets/car_images/kia_optima.jpg"},
            {"name": "Telluride", "releaseYear": 2019, "image": "src/assets/car_images/kia_telluride.jpg"},
            {"name": "Stinger", "releaseYear": 2017, "image": "src/assets/car_images/kia_stinger.jpg"},
            {"name": "Seltos", "releaseYear": 2019, "image": "src/assets/car_images/kia_seltos.jpg"},
        ],
    },
    {
        "brand": "Jeep",
        "models": [
            {"name": "Wrangler", "releaseYear": 1986, "image": "src/assets/car_images/jeep_wrangler.jpg"},
            {"name": "Cherokee", "releaseYear": 1974, "image": "src/assets/car_images/jeep_cherokee.jpg"},
            {"name": "Grand Cherokee", "releaseYear": 1992, "image": "src/assets/car_images/jeep_grand_cherokee.jpg"},
            {"name": "Compass", "releaseYear": 2006, "image": "src/assets/car_images/jeep_compass.jpg"},
            {"name": "Renegade", "releaseYear": 2014, "image": "src/assets/car_images/jeep_renegade.jpg"},
            {"name": "Gladiator", "releaseYear": 2019, "image": "src/assets/car_images/jeep_gladiator.jpg"},
        ],
    },
    {
        "brand": "Porsche",
        "models": [
            {"name": "911", "releaseYear": 1964, "image": "src/assets/car_images/porsche_911.jpg"},
            {"name": "Cayenne", "releaseYear": 2002, "image": "src/assets/car_images/porsche_cayenne.jpg"},
            {"name": "Macan", "releaseYear": 2014, "image": "src/assets/car_images/porsche_macan.jpg"},
            {"name": "Panamera", "releaseYear": 2009, "image": "src/assets/car_images/porsche_panamera.jpg"},
            {"name": "Taycan", "releaseYear": 2019, "image": "src/assets/car_images/porsche_taycan.jpg"},
            {"name": "Boxster", "releaseYear": 1996, "image": "src/assets/car_images/porsche_boxster.jpg"},
        ],
    },
    {
        "brand": "Lexus",
        "models": [
            {"name": "RX", "releaseYear": 1998, "image": "src/assets/car_images/lexus_rx.jpg"},
            {"name": "ES", "releaseYear": 1989, "image": "src/assets/car_images/lexus_es.jpg"},
            {"name": "NX", "releaseYear": 2014, "image": "src/assets/car_images/lexus_nx.jpg"},
            {"name": "GX", "releaseYear": 2002, "image": "src/assets/car_images/lexus_gx.jpg"},
            {"name": "LS", "releaseYear": 1989, "image": "src/assets/car_images/lexus_ls.jpg"},
            {"name": "IS", "releaseYear": 1999, "image": "src/assets/car_images/lexus_is.jpg"},
        ],
    },
    {
        "brand": "Volvo",
        "models": [
            {"name": "XC90", "releaseYear": 2002, "image": "src/assets/car_images/volvo_xc90.jpg"},
            {"name": "XC60", "releaseYear": 2008, "image": "src/assets/car_images/volvo_xc60.jpg"},
            {"name": "S60", "releaseYear": 2000, "image": "src/assets/car_images/volvo_s60.jpg"},
            {"name": "V60", "releaseYear": 2010, "image": "src/assets/car_images/volvo_v60.jpg"},
            {"name": "XC40", "releaseYear": 2017, "image": "src/assets/car_images/volvo_xc40.jpg"},
            {"name": "C40", "releaseYear": 2021, "image": "src/assets/car_images/volvo_c40.jpg"},
        ],
    },
    {
        "brand": "Jaguar",
        "models": [
            {"name": "XF", "releaseYear": 2007, "image": "src/assets/car_images/jaguar_xf.jpg"},
            {"name": "XE", "releaseYear": 2015, "image": "src/assets/car_images/jaguar_xe.jpg"},
            {"name": "F-Pace", "releaseYear": 2016, "image": "src/assets/car_images/jaguar_f_pace.jpg"},
            {"name": "E-Pace", "releaseYear": 2017, "image": "src/assets/car_images/jaguar_e_pace.jpg"},
            {"name": "I-Pace", "releaseYear": 2018, "image": "src/assets/car_images/jaguar_i_pace.jpg"},
            {"name": "XJ", "releaseYear": 1968, "image": "src/assets/car_images/jaguar_xj.jpg"},
        ],
    },
    {
        "brand": "Peugeot",
        "models": [
            {"name": "208", "releaseYear": 2012, "image": "src/assets/car_images/peugeot_208.jpg"},
            {"name": "308", "releaseYear": 2007, "image": "src/assets/car_images/peugeot_308.jpg"},
            {"name": "508", "releaseYear": 2010, "image": "src/assets/car_images/peugeot_508.jpg"},
            {"name": "2008", "releaseYear": 2013, "image": "src/assets/car_images/peugeot_2008.jpg"},
            {"name": "3008", "releaseYear": 2008, "image": "src/assets/car_images/peugeot_3008.jpg"},
            {"name": "5008", "releaseYear": 2009, "image": "src/assets/car_images/peugeot_5008.jpg"},
            {"name": "Rifter", "releaseYear": 2018, "image": "src/assets/car_images/peugeot_rifter.jpg"},
        ],
    },
    {
        "brand": "Fiat",
        "models": [
            {"name": "500", "releaseYear": 1957, "image": "src/assets/car_images/fiat_500.jpg"},
            {"name": "Panda", "releaseYear": 1980, "image": "src/assets/car_images/fiat_panda.jpg"},
            {"name": "Tipo", "releaseYear": 1988, "image": "src/assets/car_images/fiat_tipo.jpg"},
            {"name": "Punto", "releaseYear": 1993, "image": "src/assets/car_images/fiat_punto.jpg"},
            {"name": "Doblo", "releaseYear": 2000, "image": "src/assets/car_images/fiat_doblo.jpg"},
            {"name": "Toro", "releaseYear": 2016, "image": "src/assets/car_images/fiat_toro.jpg"},
            {"name": "Strada", "releaseYear": 1996, "image": "src/assets/car_images/fiat_strada.jpg"},
        ],
    },
    {
        "brand": "Renault",
        "models": [
            {"name": "Clio", "releaseYear": 1990, "image": "src/assets/car_images/renault_clio.jpg"},
            {"name": "Megane", "releaseYear": 1995, "image": "src/assets/car_images/renault_megane.jpg"},
            {"name": "Captur", "releaseYear": 2013, "image": "src/assets/car_images/renault_captur.jpg"},
            {"name": "Kadjar", "releaseYear": 2015, "image": "src/assets/car_images/renault_kadjar.jpg"},
            {"name": "Twingo", "releaseYear": 1992, "image": "src/assets/car_images/renault_twingo.jpg"},
            {"name": "Scenic", "releaseYear": 1996, "image": "src/assets/car_images/renault_scenic.jpg"},
            {"name": "Koleos", "releaseYear": 2007, "image": "src/assets/car_images/renault_koleos.jpg"},
        ],
    },
    {
        "brand": "Alfa Romeo",
        "models": [
            {"name": "Giulia", "releaseYear": 2015, "image": "src/assets/car_images/alfa_romeo_giulia.jpg"},
            {"name": "Stelvio", "releaseYear": 2016, "image": "src/assets/car_images/alfa_romeo_stelvio.jpg"},
            {"name": "Tonale", "releaseYear": 2022, "image": "src/assets/car_images/alfa_romeo_tonale.jpg"},
            {"name": "4C", "releaseYear": 2013, "image": "src/assets/car_images/alfa_romeo_4c.jpg"},
            {"name": "MiTo", "releaseYear": 2008, "image": "src/assets/car_images/alfa_romeo_mito.jpg"},
            {"name": "159", "releaseYear": 2005, "image": "src/assets/car_images/alfa_romeo_159.jpg"},
            {"name": "Brera", "releaseYear": 2005, "image": "src/assets/car_images/alfa_romeo_brera.jpg"},
        ],
    },
    {
        "brand": "Citroën",
        "models": [
            {"name": "C3", "releaseYear": 2002, "image": "src/assets/car_images/citroen_c3.jpg"},
            {"name": "C4", "releaseYear": 2004, "image": "src/assets/car_images/citroen_c4.jpg"},
            {"name": "C5", "releaseYear": 2001, "image": "src/assets/car_images/citroen_c5.jpg"},
            {"name": "Berlingo", "releaseYear": 1996, "image": "src/assets/car_images/citroen_berlingo.jpg"},
            {"name": "Cactus", "releaseYear": 2014, "image": "src/assets/car_images/citroen_cactus.jpg"},
            {"name": "DS3", "releaseYear": 2009, "image": "src/assets/car_images/citroen_ds3.jpg"},
            {"name": "Ami", "releaseYear": 2020, "image": "src/assets/car_images/citroen_ami.jpg"},
        ],
    },
]

# Create the car_images directory if it doesn't exist
image_dir = "src/assets/car_images"
os.makedirs(image_dir, exist_ok=True)

# Function to download an image
def download_image(url, path):
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            print(f"Downloaded: {path}")
        else:
            print(f"Failed to download {url}: {response.status_code}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

# Function to fetch image URL from SerpAPI
def fetch_image_url(brand, model, api_key):
    try:
        query = f"{brand} {model}"
        url = f"https://serpapi.com/search.json?q={query}&engine=google_images&ijn=0&api_key={api_key}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            images_results = data.get("images_results", [])
            if images_results:
                return images_results[0].get("thumbnail")
        print(f"No image found for {brand} {model}")
    except Exception as e:
        print(f"Error fetching image URL for {brand} {model}: {e}")
    return None

# Your SerpAPI key
SERPAPI_KEY = "8fd8e4fcce08f42d093496b0faf0377d27a15f18a84caf1f23f0be36976e3cb0"

# Iterate through the car database and download images
for brand in car_database:
    for model in brand["models"]:
        image_path = model["image"]
        brand_name = brand["brand"]
        model_name = model["name"]
        image_url = fetch_image_url(brand_name, model_name, SERPAPI_KEY)
        if image_url:
            download_image(image_url, image_path)