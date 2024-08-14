import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { GrLanguage } from "react-icons/gr";
import { useLocation, useNavigate } from "react-router-dom";
import he from "he";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { MdSlowMotionVideo } from "react-icons/md";
import { FaLock } from "react-icons/fa6";
const CourseDetailsView = () => {
  const [coursePost, setCoursePost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payloading, setPayLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = location.state || {};
  const [currentUser, setCurrentUser] = useState(false);


  const token = Cookies.get("access_tokennew");
  let userId = null;


  if (token) {
    try {
      userId = token;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }


  useEffect(() => {
    const token = Cookies.get("access_tokennew");
    if (token) {
      try {
        setCurrentUser(token);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);


  // Perticular Course get data API
  useEffect(() => {
    const getCourse = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API}zenstudy/api/course/coursedetail/${courseId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();


        console.log("Course_data", data);
        setCoursePost(data.coursedetail);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
    getCourse();
  }, [courseId]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <div className="text-4xl font-bold animate-pulse">ZenStudy.</div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-4xl font-bold text-red-600">
          {" "}
          Error: Please refresh the page.
        </div>
      </div>
    );
  }


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };


  const stripHtmlTags = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };


  //Payment Initiate
  const handlePayment = async (amount) => {
    setPayLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API}zenstudy/api/payment/order`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            amount,
            user_id: userId,
            course_id: courseId,
          }),
        }
      );


      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error: ${res.status} - ${res.statusText}\n${errorText}`);
        Swal.fire({
          title: "Oops. Course already purchase",
          text: "Please visit the MyCourse section to see course",
          icon: "error",
        }).then((result) => {
          navigate("/mycourse");
        });
        return;
      }


      const data = await res.json();
      //console.log("Data", data)
      handlePaymentVerify(data.data, courseId);
    } catch (error) {
      console.error("Error creating payment order:", error);
      setPayLoading(false);
    }
  };


  const handlePaymentVerify = async (data, courseId) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      name: "ZenStudy",
      description: "Making Education Imaginative",
      order_id: data.id,
      handler: async (response) => {
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API}zenstudy/api/payment/verify`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: userId,
                course_id: courseId,
              }),
            }
          );


          const verifyData = await res.json();
          //console.log("VerifyData", verifyData)
          if (verifyData.message === "Payment Successful") {
            //console.log("Payment Success")
            navigate(verifyData.Url);
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
        }
      },
      theme: {
        color: "#5f63b8",
      },
    };
    //console.log("Options", options)
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };




  const firstModule = coursePost.modules[0];


  return (
    <div className="">
      <div className="p-4 lg:p-12 bg-blue-100 w-full md:p-8 rounded-md flex flex-col justify-start items-start">
        <button
          className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-4 flex items-center lg:-mt-10 md:-mt-6 sm:mt-0"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            {coursePost?.title}
          </h1>
          <p className="mt-2 md:mt-4 text-sm md:text-base">
            {stripHtmlTags(he.decode(coursePost.description))}
          </p>
          <div className="flex items-center mt-4">
            <div className="flex items-center mr-4">
              <GrLanguage />
              <span className="ml-2">{coursePost?.language}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-12 lg:p-12 mt-8 flex flex-col md:flex-row lg:flex-row gap-1 md:gap-4 lg:gap-10 md:items-center lg:items-start items-center">
        <div className=" border-l-8 border-blue-600 p-2  w-full md:w-1/2 lg:w-2/3">
          <h2 className="text-lg md:text-xl font-bold">About Course</h2>
          <ul className="mt-4 space-y-2 flex flex-col gap-4">
            <li className="flex items-start text-justify">
              Scoring well in the UPSC mains exam requires a strategic approach,
              and understanding the importance of previous years' questions
              (PYQs) is crucial. PYQs help you identify the patterns, trends,
              and types of questions frequently asked, which can guide your
              preparation and focus on key areas. Developing the ability to
              write effective answers, even with limited information, is
              essential to maximize your marks. This skill helps you demonstrate
              a comprehensive understanding of the subject and meet the exam's
              demands.
            </li>
            <li className="flex items-start text-justify">
              Our course offers detailed explanations of PYQs, teaching you how
              to tackle various question types and structure your answers
              effectively. Mains performance is critical for making it onto the
              list, while the interview stage determines your final rank. By
              joining our course, you'll gain insights into the nuances of the
              exam and learn how to address the questions holistically, ensuring
              you cover every aspect and increase your chances of success.
            </li>
          </ul>
        </div>


        <div className="bg-white justify-center items-center max-w-sm  mt-[20px] md:mt-[-80px] lg:mt-[-120px] relative rounded-2xl overflow-hidden shadow-lg m-4 p-4 w-full h-1/2">


          {firstModule && (
            <div key={0}>
              {firstModule.videos.length > 0 ? (
                <div key={firstModule.videos[0]._id}>
                  <iframe
                    src={firstModule.videos[0].videoUrl || "no videos"}
                    frameborder="0"
                    className="top-0 left-0 h-[30vh] w-[100%]"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="zenstudy"
                  ></iframe>
                  
                </div>
              ) : (
                <div>No videos</div>
              )}
            </div>
          )}


          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2 text-blue-600">
              {coursePost?.title}
            </div>
            {
              //<p className="text-gray-700 text-base">Tutor</p>
            }
            <p className="text-gray-600 text-xs mt-4">
              Created at - {formatDate(coursePost?.createdAt)}
            </p>
            {
              // <p className="text-gray-600">course day</p>
            }
          </div>
          <div className=" flex flex-row px-6 pt-4 pb-2 justify-between items-center  border-t-2">
            <p className="text-blue-600 font-bold text-2xl">
              ₹ {coursePost?.price}
            </p>
            {currentUser ? (
              <button
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
                onClick={() => handlePayment(coursePost?.price)}
                disabled={!payloading}
              >
                {!payloading ? "Please wait..." : "Pay Now"}
              </button>
            ) : (
              <button
                onClick={()=> navigate("/sign-in")}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
              >
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>


      <div className="p-2 md:p-12 lg:p-12 bg-blue-100 ">
        {coursePost.modules.map((title, index) => (
          <div
            key={index}
            className="mb-4 bg-white rounded-2xl shadow overflow-hidden"
          >
            <div className="flex items-center p-4 cursor-pointer">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-4" />


              <span className="flex-1 font-semibold">{title.moduleTitle}</span>


              {
                //  <div className="transform rotate-0 transition-transform">
                //         <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                //         </svg>
                //     </div>
              }
            </div>
            {
              //     title.videos.length > 0 ? (title.videos.map(({ _id, videoTitle }) => (
              //     <div className="pb-2 px-10 flex items-center justify-start" key={_id}>
              //         <MdSlowMotionVideo className='text-blue-500' />
              //         <p className='px-4 text-gray-500 bg-gray-50 w-full '>{videoTitle || "no videos"}</p>
              //         <FaLock className='text-blue-400 ' />
              //     </div>
              // ))) : (<h2>No videos</h2>)
            }
          </div>
        ))}
      </div>
    </div>
  );
};


export default CourseDetailsView;


