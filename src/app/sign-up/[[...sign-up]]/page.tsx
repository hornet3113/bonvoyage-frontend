import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-4xl mx-auto shadow-lg rounded-2xl overflow-hidden bg-white">

        <div className="hidden md:flex w-3/5 items-center justify-center bg-gray-200 p-6">
          <div className="w-full h-full min-h-[500px] rounded-2xl bg-gray-300 flex items-center justify-center text-gray-400 text-sm">
            <img
              src="/register_3.png"
              alt="BonVoyage"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>

        <div className="w-full md:w-2/5 flex items-center justify-center p-8">
          <SignUp
            appearance={{
              elements: {
                // Checkbox de aceptación legal
                formFieldCheckboxInput:
                  "accent-cyan-500 w-4 h-4 cursor-pointer",
                // Texto del label legal (links de ToS / Privacy)
                formFieldCheckboxLabel:
                  "text-xs text-gray-500 leading-relaxed",
                // Links dentro del label legal
                formFieldCheckboxLabelText__termsOfServiceLink:
                  "text-cyan-600 hover:text-cyan-700 underline font-medium",
                formFieldCheckboxLabelText__privacyPolicyLink:
                  "text-cyan-600 hover:text-cyan-700 underline font-medium",
                // Botón principal de registro
                formButtonPrimary:
                  "bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-200",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
