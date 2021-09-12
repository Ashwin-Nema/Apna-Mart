import Radio from '@material-ui/core/Radio';
import { RadioGroup, FormControlLabel, FormControl } from '@material-ui/core'
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import { useSelector } from "react-redux";
import { Alert, Modal } from "react-bootstrap";
import { deliverydate, hidemodal, showmodalwithmessageandvariant } from '../../utils'
import { useState } from "react";
import CheckCircleOutlinedIcon from '@material-ui/icons/CheckCircleOutlined';
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import {axiosinstance} from '../../config'

export default function PaymentSection() {
    const { Name, Email, Mobilenumber } = useSelector(state => state.Profile)
    const cart = useSelector(state => state.Cart)
    const cartprice = useSelector(state => state.CartPrice)

    const [modalmessage, changemodalmessage] = useState("")
    const [modal, showmodal] = useState(false)
    const [modalvariant, changemodalvariant] = useState("warning")
    const [paymentmode, changepaymentmode] = useState("Cash")

    const displaymodal = (message, variant) => {
        showmodalwithmessageandvariant(showmodal, message,changemodalmessage, variant, changemodalvariant)
    }

    function loadScript(src) {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => {

                resolve(true);
            };
            script.onerror = () => {

                resolve(false);
            };
            document.body.appendChild(script);
        });
    }

    const setloginerror = (error) => {
        if (error === "Token is not provided" || error === "Please provide a valid token") {
            displaymodal("Sorry you have been logged out. Please login again to continue", "danger")
            return true
        }
        return false
    }

    async function displayRazorpay() {
        const res = await loadScript(
            "https://checkout.razorpay.com/v1/checkout.js"
        );

        if (!res) {
            displaymodal("Sorry Razorpay could not be loaded. Please use cash payment mode or try again later", "danger")
            return;
        }

        const result = await axiosinstance.post('/user/order/payment/razorpay', {cartprice})

        if (!result) {
            displaymodal("You are not online. Please be online if you want to place order", "danger")
            return;
        }

        const loginerror = setloginerror(result.data.error)

        if (result.data.error !== undefined && !loginerror) {
            displaymodal(result.data.error, "danger")
            return
        }

        if (result.data.error === undefined) {

            const { amount, id: order_id, currency } = result.data;

            const options = {
                key: "rzp_test_lYaL0slH0VoZzj", // Enter the Key ID generated from the Dashboard
                amount: amount.toString(),
                currency: currency,
                name: "Apnamart",
                image: "https://res.cloudinary.com/ash006/image/upload/v1622457972/shop_myswcw.jpg",
                description: "",
                order_id: order_id,
                handler: async function (response) {
                    const data = {
                        orderCreationId: order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySignature: response.razorpay_signature,
                    };

                    const successresponse = await axiosinstance.post("/user/order/payment/razorpay/success", {cartprice, items:cart, ...data})

                    if (!successresponse) {
                        displaymodal("Sorry something went wrong your order could not be placed.", "danger")
                        return
                    }
                },
                prefill: {
                    name: Name,
                    email: Email,
                    contact: Mobilenumber,
                },
                notes: {
                    address: "So ",
                },
                theme: {
                    color: "#ffc107",
                },
            };
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        }

    }

    const cashmode = () => {
        axiosinstance.post("/user/order/cash", {items:cart, cartprice}).then(({data}) => {
            const loginerror = setloginerror(data.error)

            if (data.error !== undefined && !loginerror) {
                displaymodal(data.error, "danger")
                return
            }
            displaymodal("Your order is successfully placed", "warning")
        }).catch(() => {
            displaymodal("Sorry your order could not be placed. Please try again later", "danger")
        }

        )
    }

    return (
        <>
            <div className="checkoutaccordion mt-5">
                <div className="w-75 profilecontentdisplaycolor">
                    <Alert variant="info" className="w-25">
                        Delivery by {deliverydate}
                    </Alert>
                    <h5>Select mode of payment</h5>
                    <FormControl className="w-100 profilecontentdisplaycolor" component="fieldset">
                        <RadioGroup row aria-label="position" name="position" defaultValue="Cash">
                            <FormControlLabel
                                label="Cash on delivery"
                                value="Cash"
                                onClick={() => changepaymentmode("Cash")}
                                control={<Radio color="primary" />}
                                labelPlacement="start"
                            />
                            <FormControlLabel
                                value="Razorpay"
                                onClick={() => changepaymentmode("Razorpay")}
                                control={<Radio color="primary" />}
                                label="Razorpay"
                                labelPlacement="start"
                            />
                        </RadioGroup>
                    </FormControl>
                    {
                        paymentmode === "Cash" ? <button onClick={cashmode} className="bordernone p-2 rounded-pill bg-warning mt-3" >
                            Continue <DoubleArrowIcon />
                        </button> : <button onClick={displayRazorpay} className="bordernone p-2 rounded-pill bg-warning mt-3" >
                            Continue <DoubleArrowIcon />
                        </button>
                    }
                </div>
            </div>

            <Modal centered show={modal} contentClassName="modalwithoutcolor py-5" onHide={() => hidemodal(showmodal)}>
                <Alert variant={`${modalvariant}`}>
                    <span className="d-flex justify-content-center ">
                        {
                            modalmessage === "Your order is successfully placed" ?
                                <>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex justify-content-center">
                                            <CheckCircleOutlinedIcon style={{ color: "green", border: "none" }} />
                                        </div>

                                        <div >
                                            <h5>
                                                {modalmessage}
                                            </h5>
                                        </div>
                                    </div>
                                </>
                                :
                                <>
                                    <ErrorRoundedIcon style={{ color: "red" }} />
                                    <h5>
                                        {modalmessage}
                                    </h5>
                                </>
                        }
                    </span>
                </Alert>
            </Modal>

        </>
    )
}