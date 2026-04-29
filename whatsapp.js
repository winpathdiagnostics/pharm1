/**
 * WhatsApp Messaging Engine
 * Formats the customer's data, handles Promo Code calculations, 
 * and generates the encoded WhatsApp API redirect link.
 */
export function generateWhatsAppLink(cart, formData, requiresRx, appliedPromo) {
    const WA_NUMBER = "919380116362"; 
    
    // --- BUILD CUSTOMER DETAILS SECTION ---
    let msg = `*NEW MEDICAL ORDER*\n\n`;
    msg += `*Patient Details:*\n`;
    msg += `Name: ${formData.name}\n`;
    msg += `Age: ${formData.age}\n`;
    msg += `Contact: ${formData.mobile}\n`;
    msg += `Address: ${formData.address}\n`;
    
    if (formData.lat && formData.lng) {
        msg += `GPS Pin: https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}\n`;
    }
    
    // --- BUILD CART ITEMS SECTION ---
    msg += `\n*Medicines Requested:*\n`;
    let subtotal = 0;

    cart.forEach((item, i) => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        
        // Appends the specific Pack Size into the receipt string so you know exactly what size to deliver
        msg += `${i + 1}. ${item.name} [${item.packSize}] (x${item.qty}) - ₹${lineTotal.toFixed(2)}\n`;
    });
    
    // --- BUILD FINANCIAL SUMMARY & PROMO SECTION ---
    msg += `\n*Subtotal:* ₹${subtotal.toFixed(2)}`;

    let finalTotal = subtotal;

    // Conditionally attach Promo Code discount line ONLY if a code was validated by main.js
    if (appliedPromo) {
        const discountAmt = subtotal * (appliedPromo.discount / 100);
        finalTotal = subtotal - discountAmt;
        msg += `\n*Promo Applied (${appliedPromo.code}):* -₹${discountAmt.toFixed(2)}`;
    }

    msg += `\n*Final Total:* ₹${finalTotal.toFixed(2)}\n`;
    
    // --- BUILD RESTRICTED PRESCRIPTION WARNING ---
    if (requiresRx) {
        msg += `\n⚠️ *ACTION REQUIRED*\n_Please manually attach the prescription image to this chat before sending!_\n`;
    }

    // Return the executable WhatsApp link
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}
