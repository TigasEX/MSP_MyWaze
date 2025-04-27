import { ref } from 'vue'
import { carDatabase } from '@/carDatabase'

const selectedBrand = ref('')
const selectedModel = ref('')
const availableModels = ref([])
const vehicleName = ref('')
const vehicles = ref([])
const showVehicleMenu = ref(false)
const showVehicleList = ref(false)

export function useVehicles1() {
  const toggleVehicleMenu = () => {
    showVehicleMenu.value = !showVehicleMenu.value
  }

  const toggleVehicleList = () => {
    showVehicleList.value = !showVehicleList.value
  }

  const updateModels = () => {
    if (!selectedBrand.value) {
      availableModels.value = carDatabase.flatMap(b => b.models)
    } else {
      const brand = carDatabase.find(b => b.brand === selectedBrand.value)
      availableModels.value = brand ? brand.models : []
    }
    selectedModel.value = ''
  }

  const registerVehicle = () => {
    if (vehicleName.value && selectedBrand.value && selectedModel.value) {
      const brand = carDatabase.find(b => b.brand === selectedBrand.value)
      const model = brand?.models.find(m => m.name === selectedModel.value)
      vehicles.value.push({
        name: vehicleName.value,
        brand: selectedBrand.value,
        model: selectedModel.value,
        image: model?.image || 'src/assets/car_images/placeholder_car.jpg',
      })
      vehicleName.value = ''
      selectedBrand.value = ''
      selectedModel.value = ''
      availableModels.value = []
      showVehicleMenu.value = false
    }
  }

  return { carDatabase, selectedBrand, selectedModel, availableModels, vehicleName, vehicles, showVehicleMenu, showVehicleList, toggleVehicleMenu, toggleVehicleList, updateModels, registerVehicle }
}