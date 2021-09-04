import ShoppingBasketIcon from '@material-ui/icons/ShoppingBasket';
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux';
export const Viewcartoption = ({selectcomponenttodisplay , changedisplaycomponent}) => {
    const viewcartref = useRef()
    const opacity = useSelector(state => state.opacity)
    const changecursor = selectcomponenttodisplay === "mycart" ? "" : "cursorpointer"
    const showcart = () => {
        changedisplaycomponent("mycart")
    }

    useEffect(() => {
        if (viewcartref.current !== null && viewcartref.current !== undefined) {
            switch (opacity) {
                case 1:
                    viewcartref.current.style.backgroundColor = "white"
                    return

                case 0.5:
                    viewcartref.current.style.backgroundColor = "rgb(0, 0, 0,0.1)"
                    return

                default:
                    return
            }
        }
    }, [opacity])
    
    return (
        <>
        <div onClick={showcart} ref={viewcartref} className={`mt-5 p-2 d-flex justify-content-center profilecontentdisplaycolor ${changecursor}`}>
            <span>
            View your cart
            </span>
            <ShoppingBasketIcon style={{ color: "red" }} />
        </div>
        </>
    )
}