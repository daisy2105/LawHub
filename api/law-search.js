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
        const lawPrompt = `You are a legal expert on Indian law. Answer this question about Indian law concisely and accurately:

${query}

Provide specific legal information including relevant articles, sections, or acts when applicable.`;

        // Use a working Hugging Face API key and simpler models
        const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || 'YOUR_HUGGINGFACE_API_KEY_HERE';
        
        let response, result;
        const fetch = (await import('node-fetch')).default;
        
        console.log('Processing law query:', query);
        
        try {
            // Use a more reliable model - Google Flan-T5
            const model = 'google/flan-t5-base';
            console.log(`Using model: ${model}`);
            
            response = await fetch(`https://router.huggingface.co/hf-inference/${model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: lawPrompt,
                    parameters: {
                        max_length: 300,
                        temperature: 0.3,
                        do_sample: true
                    },
                    options: {
                        wait_for_model: true,
                        use_cache: false
                    }
                })
            });

            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('API Response data:', data);
                
                if (data.error) {
                    throw new Error(data.error);
                }

                if (Array.isArray(data) && data.length > 0) {
                    result = data[0].generated_text || data[0].summary_text || data[0].text;
                } else if (data.generated_text) {
                    result = data.generated_text;
                } else if (typeof data === 'string') {
                    result = data;
                } else {
                    throw new Error('Unexpected response format');
                }

                // Clean up the result
                if (result) {
                    result = result.replace(lawPrompt, '').trim();
                    
                    // Enhance the response with Indian law context
                    if (result.length < 50) {
                        result = await generateFallbackResponse(query);
                    }
                } else {
                    throw new Error('No result generated');
                }

            } else {
                const errorData = await response.text();
                console.error('API Error:', errorData);
                throw new Error(`API request failed: ${response.status}`);
            }

        } catch (apiError) {
            console.error('API Error:', apiError);
            result = await generateFallbackResponse(query);
        }

        // Save to search history if user is authenticated
        if (userId && result) {
            try {
                await SearchHistory.create({
                    userId: userId,
                    query: query,
                    response: result,
                    model: 'flan-t5-enhanced'
                });
                console.log('Search history saved for user:', userId);
            } catch (historyError) {
                console.error('Error saving search history:', historyError);
            }
        }

        res.json({
            success: true,
            query: query,
            response: result,
            timestamp: new Date().toISOString(),
            source: 'AI Legal Assistant'
        });

    } catch (error) {
        console.error('Law search error:', error);
        
        const fallbackResponse = await generateFallbackResponse(req.body.query || '');
        
        res.json({
            success: true,
            query: req.body.query || '',
            response: fallbackResponse,
            timestamp: new Date().toISOString(),
            source: 'Legal Knowledge Base'
        });
    }
});

// Generate fallback response based on legal keywords
async function generateFallbackResponse(query) {
    const queryLower = query.toLowerCase();
    
    // Constitutional Law responses
    if (queryLower.includes('fundamental right') || queryLower.includes('article 14') || queryLower.includes('equality')) {
        return `**Right to Equality (Article 14-18)**

Article 14 guarantees equality before law and equal protection of laws to all persons within Indian territory.

**Key Provisions:**
• Article 14: Equality before law
• Article 15: Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth
• Article 16: Equality of opportunity in public employment
• Article 17: Abolition of untouchability
• Article 18: Abolition of titles

**Legal Significance:** This is a basic feature of the Constitution and cannot be amended. It ensures equal treatment by the state and non-discrimination.`;
    }
    
    if (queryLower.includes('freedom of speech') || queryLower.includes('article 19')) {
        return `**Freedom of Speech and Expression (Article 19)**

Article 19(1)(a) guarantees freedom of speech and expression to all citizens.

**Scope includes:**
• Right to express opinions, beliefs, and ideas
• Freedom of press and media
• Right to information
• Commercial speech (with restrictions)

**Reasonable Restrictions under Article 19(2):**
• Security of the State
• Friendly relations with foreign states
• Public order, decency or morality
• Contempt of court, defamation, or incitement to offense

**Important Case:** Shreya Singhal v. Union of India (2015) - Struck down Section 66A of IT Act.`;
    }
    
    if (queryLower.includes('arrest') || queryLower.includes('article 22') || queryLower.includes('detention')) {
        return `**Protection Against Arrest and Detention (Article 22)**

**Rights of Arrested Person:**
• Right to be informed of grounds of arrest
• Right to consult and be defended by lawyer of choice
• Right to be produced before magistrate within 24 hours

**Preventive Detention:**
• No right to lawyer during interrogation
• Grounds of detention to be communicated within 5 days
• Maximum period without Advisory Board approval: 3 months

**Habeas Corpus:** Writ remedy available to challenge illegal detention under Article 32.`;
    }
    
    // Criminal Law responses
    if (queryLower.includes('murder') || queryLower.includes('section 302') || queryLower.includes('ipc')) {
        return `**Murder under Indian Penal Code**

**Section 302 IPC:** Punishment for murder - Death penalty or life imprisonment plus fine.

**Section 300:** Definition of Murder - Intentional killing with knowledge that act is likely to cause death.

**Exceptions (Section 300):**
• Grave and sudden provocation
• Exceeding right of private defense
• Public servant exceeding powers
• Sudden fight without premeditation
• Consent of victim (if above 18 years)

**Related Sections:**
• Section 299: Culpable homicide
• Section 301: Culpable homicide by causing death of person other than intended`;
    }
    
    if (queryLower.includes('bail') || queryLower.includes('anticipatory bail')) {
        return `**Bail under Criminal Law**

**Regular Bail (Section 437 CrPC):**
• Available for bailable offenses as matter of right
• For non-bailable offenses, at discretion of court
• Considerations: nature of offense, evidence, flight risk, tampering

**Anticipatory Bail (Section 438 CrPC):**
• Available from High Court or Sessions Court
• Protection from arrest in anticipation
• Can impose conditions

**Supreme Court Guidelines (Sanjay Chandra v. CBI):**
• Bail is rule, jail is exception
• Personal liberty is fundamental right
• Speedy trial considerations`;
    }
    
    // Property and Civil Law
    if (queryLower.includes('property') || queryLower.includes('transfer') || queryLower.includes('sale deed')) {
        return `**Property Laws in India**

**Transfer of Property Act, 1882:**
• Governs transfer of immovable property
• Requirements for valid transfer
• Rights and liabilities of parties

**Registration Act, 1908:**
• Mandatory registration for immovable property above ₹100
• Sale deed, mortgage, lease for more than 1 year

**Indian Succession Act:**
• Governs inheritance and succession
• Will, intestate succession, probate

**Key Requirements:**
• Clear title, proper documentation
• Due diligence before purchase
• Registration within 4 months of execution`;
    }
    
    // Family Law
    if (queryLower.includes('marriage') || queryLower.includes('divorce') || queryLower.includes('maintenance')) {
        return `**Family Law in India**

**Marriage Laws:**
• Hindu Marriage Act, 1955 (Hindus, Buddhists, Sikhs, Jains)
• Muslim Personal Law (Shariat) Application Act
• Indian Christian Marriage Act, 1872
• Special Marriage Act, 1954 (Inter-religious marriages)

**Divorce Grounds:**
• Mutual consent
• Cruelty, desertion, conversion
• Incurable mental disorder
• Presumption of death

**Maintenance:**
• Section 125 CrPC: Criminal maintenance
• Personal laws: Civil maintenance
• Women entitled to maintenance from husband`;
    }
    
    // Consumer Protection
    if (queryLower.includes('consumer') || queryLower.includes('deficiency in service') || queryLower.includes('unfair trade')) {
        return `**Consumer Protection Act, 2019**

**Consumer Rights:**
• Right to safety, information, choice
• Right to be heard and seek redressal
• Right to consumer education

**Consumer Disputes Redressal:**
• District Commission: Up to ₹1 crore
• State Commission: ₹1 crore to ₹10 crore  
• National Commission: Above ₹10 crore

**Deficiency in Service:** Includes medical negligence, educational services, banking, insurance

**E-commerce provisions:** Platform liability, grievance redressal, country of origin marking`;
    }
    
    // Default response for unmatched queries
    return `**Legal Information for: "${query}"**

I understand you're seeking legal information. Here are some general guidelines:

**For Constitutional Matters:**
• Fundamental Rights (Articles 12-35)
• Directive Principles (Articles 36-51)
• Constitutional remedies through writ petitions

**For Criminal Issues:**
• Indian Penal Code (IPC) - Substantive criminal law
• Code of Criminal Procedure (CrPC) - Procedural law
• Evidence Act - Rules of evidence

**For Civil Matters:**
• Civil Procedure Code (CPC)
• Contract Act, Property laws
• Family laws based on personal laws

**Important:** This is general information only. For specific legal advice, please consult a qualified lawyer.

**Disclaimer:** Laws may vary based on specific circumstances, state laws, and recent amendments. Always verify current legal provisions.`;
}

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