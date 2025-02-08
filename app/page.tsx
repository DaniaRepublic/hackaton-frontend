'use client'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

const base = "http://24.199.65.32:8000"
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

type TMeal = {
  id: number,
  title: string,
  image: string,
  cost: number,
  meal_type: string,
}

type TMealPlan = {
  weekly_plan: TMeal[],
  total_cost: number
}

export default function WeeklyBudgetPlanner() {
  const [budget, setBudget] = useState("40")
  const [timeoutId, setTimeoutId] = useState<string | NodeJS.Timeout>()
  const [mealPlan, setMealPlan] = useState<TMealPlan>()
  const [error, setError] = useState<string | null>()

  useEffect(() => {
    handlePriceChange("40")
  }, [])

  const handlePriceChange = (budget: string) => {
    clearTimeout(timeoutId)
    setBudget(budget)
    setTimeoutId(
      setTimeout(async () => {
        const b = parseInt(budget)
        if (!b) return

        try {
          const url = base + `/weekly_plan?budget=${budget}`
          const resp = await fetch(url)
          // handle error
          if (!resp.ok) {
            setError("Couldn't create a meal plan for the given budget. Try a different budget.")
            return
          }
          setError(null)

          const meals = await resp.json()
          console.log(meals)
          setMealPlan(meals)
        } catch {
          setError("Couldn't create a meal plan for the given budget. Try a different budget.")
        }
      }, 250)
    )
  }

  const handleReplaceItem = async (idx: number) => {
    if (!mealPlan) return
    const idToReplace = mealPlan.weekly_plan[idx].id

    const url = base + `/replace_meal?meal_id=${idToReplace}&curr_price=${parseInt(String(mealPlan.total_cost / 100))}&budget=${budget}`

    try {
      const resp = await fetch(url)
      const data = await resp.json()
      console.log(data)
      const newPlan: TMeal[] = mealPlan.weekly_plan.map((meal, index) => {
        if (idx === index) {
          return data.replacement_meal
        }
        return meal
      })

      const costs = newPlan.map(meal => meal.cost)
      const newTotalPrice = costs.reduce((partialSum, a) => partialSum + a, 0);

      setMealPlan({
        total_cost: newTotalPrice,
        weekly_plan: [...newPlan]
      })
    } catch {
      alert("Couldn't replace item, substitute not found.")
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-center">
        <Input type="number" value={budget} placeholder="Enter dollar amount" className="max-w-xs" onChange={(e) => handlePriceChange(e.target.value)} />
      </div>

      <div className="grid gap-6">
        {error
          ?
          <p>{error}</p>
          :
          mealPlan
            ?
            <>
              <h2 className="text-xl font-semibold">Total cost: {(mealPlan?.total_cost / 100).toFixed(2)}$</h2>
              {daysOfWeek.map((day, dayIdx) => (
                <div key={day} className="space-y-2">
                  <h2 className="text-xl font-semibold">{day}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {
                      mealPlan?.weekly_plan.slice(dayIdx * 3, (dayIdx + 1) * 3).map((data, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <div className="bg-red-500 w-5 h-5 top-0 right-0 text-center align-middle" onClick={() => handleReplaceItem(dayIdx * 3 + idx)}>X</div>
                            <CardTitle>{data.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <img src={data.image} alt="meal image" />
                            <p>
                              {(data.cost / 100).toFixed(2)}$
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              ))}
            </>
            :
            <></>
        }
      </div>
    </div>
  )
}

