export function generateWhatsAppLink(cart, formData, requiresRx) {
    const WA_NUMBER = "919380116362"; 
    
    let msg = `*NEW MEDICAL ORDER*\n\n`;
    msg += `*Patient Details:*\n`;
    msg += `Name: ${formData.name}\n`;
    msg += `Age: ${formData.age}\n`;
    msg += `Contact: ${formData.mobile}\n`;
    msg += `Address: ${formData.address}\n`;
    
    if (formData.lat && formData.lng) {
        msg += `GPS Pin: https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}\n`;
    }
    
    msg += `\n*Medicines Requested:*\n`;
    cart.forEach((item, i) => {
        msg += `${i + 1}. ${item.name} (x${item.qty}) - ₹${(item.price * item.qty).toFixed(2)}\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const savings = cart.reduce((sum, item) => sum + ((item.mrp - item.price) * item.qty), 0);

    msg += `\n*Estimate Total:* ₹${total.toFixed(2)}`;
    msg += `\n*Total Savings:* ₹${savings.toFixed(2)}\n`;
    
    if (requiresRx) {
        msg += `\n⚠️ *ACTION REQUIRED*\n_Please manually attach the prescription image to this chat before sending!_\n`;
    }

    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}
