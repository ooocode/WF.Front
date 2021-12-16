import { Button, Input } from "antd"
import React, { useEffect, useState } from "react"
import { produce } from 'immer'
interface IInputGroupProps {
    initValue: string[]
    onChange?: (newValue: string[]) => void
}

interface Item {
    value: string
    index: number
}

export const InputGroup = (props: IInputGroupProps) => {
    let [items, setItems] = useState<Item[]>([])

    useEffect(() => {
        let newItems: Item[] = []
        for (let index = 0; index < props.initValue.length; index++) {
            const value = props.initValue[index];
            newItems.push({ value: value, index: index })
        }
        setItems(newItems)
    }, [props.initValue])

    const addInputClicked = () => {
        let newItems = produce(items, target => {
            target.push({ index: items.length, value: '' })
        })

        setItems(newItems)
    }

    const removeInputClicked = (item: Item) => {
        let newItems = produce(items, target => {
            target = target.splice(item.index, 1)
        })

        if (props.onChange) {
            props.onChange(newItems.map(e => e.value))
        }

        setItems(newItems)
    }

    const inputOnChange = (newValue: string, item: Item) => {
        let newItems = produce(items, target => {
            let filter = target.filter(e => e.index === item.index)
            filter.forEach(e => e.value = newValue)
        })

        if (props.onChange) {
            props.onChange(newItems.map(e => e.value))
        }

        setItems(newItems)
    }

    return <div>
        {
            items.map(item => <div key={item.index}>
                <Input defaultValue={item.value} onChange={e => inputOnChange(e.target.value, item)} style={{ width: 300 }} />  <Button onClick={() => removeInputClicked(item)}>-</Button>
            </div>
            )
        }

        <Button size="small" onClick={() => addInputClicked()}>添加</Button>
    </div>
}