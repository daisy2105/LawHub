const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Search History Schema
const SearchHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    query: { type: String, required: true },
    response: { type: String, required: true },
    model: { type: String, default: 'mistral-7b' },
    searchedAt: { type: Date, default: Date.now }
});

const SearchHistory = mongoose.model('SearchHistory', SearchHistorySchema);

// Law Search using Hugging Face API with multiple model fallbacks
router.post('/query', async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id; // From auth middleware
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        // Enhanced prompt to ensure law-specific responses
        const lawPrompt = `You are a specialized legal AI assistant for Indian law. Only answer questions related to Indian law, legal procedures, acts, constitution, legal rights, court procedures, and legal advice.

If the question is not related to Indian law or legal matters, respond with: "I can only provide information about Indian law and legal matters. Please ask a question related to Indian constitution, acts, legal procedures, or legal rights."

Question: ${query}

Please provide a comprehensive answer with relevant legal sections, acts, or constitutional articles where applicable. Keep the response clear and structured.`;

        // Try multiple models for better reliability
        const models = [
            'mistralai/Mistral-7B-Instruct-v0.3',
            'microsoft/DialoGPT-medium',
            'google/flan-t5-large'
        ];

        let response, result;
        const fetch = (await import('node-fetch')).default;
        
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                
                response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'YOUR_HUGGINGFACE_API_KEY_HERE'}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: lawPrompt,
                        parameters: {
                            max_new_tokens: 400,
                            temperature: 0.3,
                            top_p: 0.9,
                            do_sample: true,
                            return_full_text: false
                        },
                        options: {
                            wait_for_model: true,
                            use_cache: false
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response:', data);
                    
                    if (data.error) {
                        console.log(`Model ${model} error:`, data.error);
                        continue; // Try next model
                    }

                    if (Array.isArray(data) && data.length > 0) {
                        result = data[0].generated_text || data[0].text || 'No response generated';
                    } else if (data.generated_text) {
                        result = data.generated_text;
                    } else if (data[0] && data[0].generated_text) {
                        result = data[0].generated_text;
                    } else {
                        console.log(`Unexpected response format from ${model}:`, data);
                        continue;
                    }

                    // Clean up the result
                    result = result.replace(lawPrompt, '').trim();
                    
                    if (result && result.length > 10) {
                        console.log(`Success with model: ${model}`);
                        break; // Successfully got result
                    }
                }
            } catch (error) {
                console.log(`Error with model ${model}:`, error.message);
                continue; // Try next model
            }
        }

        // If all models failed, provide fallback
        if (!result || result.length < 10) {
            result = `I apologize, but I'm currently unable to process your query due to API limitations. 

For your question: "${query}"

Here are some general guidelines:
• For constitutional matters, refer to the Constitution of India
• For criminal law, check the Indian Penal Code (IPC) and Code of Criminal Procedure (CrPC)
• For civil matters, refer to the Civil Procedure Code (CPC)
• For specific legal advice, please consult with a qualified lawyer

You can also browse our Constitution courses or connect with legal experts for detailed assistance.`;
        }

        // Save to search history if user is authenticated
        if (userId) {
            try {
                await SearchHistory.create({
                    userId: userId,
                    query: query,
                    response: result,
                    model: 'mistral-7b-fallback'
                });
                console.log('Search history saved for user:', userId);
            } catch (historyError) {
                console.error('Error saving search history:', historyError);
                // Don't fail the request if history save fails
            }
        }

        res.json({
            success: true,
            query: query,
            response: result,
            timestamp: new Date().toISOString(),
            source: 'AI Assistant'
        });

    } catch (error) {
        console.error('Law search error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            fallback: `I'm currently experiencing technical difficulties. For immediate assistance with legal questions, please:

1. Browse our Constitution courses for fundamental law concepts
2. Connect with our legal experts through the chat feature
3. Try rephrasing your question and search again

Your question: "${req.body.query || 'No query provided'}"

Common legal resources:
• Constitution of India - Fundamental Rights (Articles 12-35)
• Indian Penal Code - Criminal offenses and penalties
• Civil Procedure Code - Civil court procedures
• Consumer Protection Act - Consumer rights and remedies`
        });
    }
});

// Get search history for user
router.get('/history', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const history = await SearchHistory.find({ userId })
            .sort({ searchedAt: -1 })
            .limit(20)
            .select('query response searchedAt model');

        res.json({
            success: true,
            history: history,
            count: history.length
        });

    } catch (error) {
        console.error('Error fetching search history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch search history'
        });
    }
});

// Clear search history
router.delete('/history', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        await SearchHistory.deleteMany({ userId });

        res.json({
            success: true,
            message: 'Search history cleared'
        });

    } catch (error) {
        console.error('Error clearing search history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear search history'
        });
    }
});

module.exports = router;