import React, { useState } from 'react';

const NaukriCSVUpload = () => {
    const [csvFile, setCsvFile] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 🚨 UPDATE THIS to your actual Hugging Face URL if different
    const API_URL = "https://vinu019-resume-backend.hf.space/api/upload-csv-sync";

    const handleFileChange = (e) => {
        setCsvFile(e.target.files[0]);
    };

    const handleSync = async (e) => {
        e.preventDefault();
        
        if (!csvFile || !email || !password) {
            setStatus("⚠️ Please provide the CSV file, email, and password.");
            return;
        }

        setIsLoading(true);
        setStatus("🚀 Sending to ForgePro Cloud Bot...");

        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("naukri_email", email);
        formData.append("naukri_password", password);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("✅ " + data.message);
                // Clear the form on success
                setCsvFile(null);
                setEmail('');
                setPassword('');
            } else {
                setStatus("❌ Error: " + data.message);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setStatus("❌ Failed to connect to the backend bot.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-900 border border-gray-700 rounded-xl shadow-lg max-w-md mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span> Naukri Hyper-Sync
            </h2>
            <p className="text-sm text-gray-400 mb-6">
                Upload your Naukri candidate CSV. Our Cloud Bot will securely fetch all resumes in the background.
            </p>

            <form onSubmit={handleSync} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Upload CSV</label>
                    <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-gray-800 border border-gray-700 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Naukri Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="recruiter@company.com"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Naukri Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-md font-bold text-white transition-all ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                >
                    {isLoading ? 'Deploying Bot...' : 'Start Hyper-Sync'}
                </button>

                {status && (
                    <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-md text-sm text-center text-gray-200">
                        {status}
                    </div>
                )}
            </form>
        </div>
    );
};

export default NaukriCSVUpload;