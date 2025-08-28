
interface BookingHeaderProps {
  hasSuccessfulPayment: boolean;
}

const BookingHeader = ({ hasSuccessfulPayment }: BookingHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Book Your Mock Interview
      </h1>
      <p className="text-xl text-slate-300 max-w-3xl mx-auto">
        {hasSuccessfulPayment 
          ? "You have a pending interview. Complete your profile and select a plan to continue."
          : "Fill out the form below and we'll match you with an experienced interviewer instantly."
        }
      </p>
    </div>
  );
};

export default BookingHeader;
